const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

export function getUrl(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

export function isValidExternalUrl(value) {
  return Boolean(getUrl(value));
}

export function isGoogleDriveUrl(value) {
  const url = getUrl(value);
  return Boolean(url && [...DRIVE_HOSTS].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)));
}

export function parseGoogleDriveLink(value) {
  const url = getUrl(value);
  if (!url || !isGoogleDriveUrl(value)) return null;

  const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  const folderMatch = url.pathname.match(/\/folders\/([^/?]+)/);
  const documentMatch = url.pathname.match(/\/(?:document|spreadsheets|presentation|drawings)\/d\/([^/]+)/);
  const id = fileMatch?.[1] || folderMatch?.[1] || documentMatch?.[1] || url.searchParams.get('id');
  if (!id) return null;

  const type = folderMatch ? 'folder' : 'file';
  return {
    id,
    type,
    viewUrl: type === 'folder'
      ? `https://drive.google.com/drive/folders/${id}`
      : `https://drive.google.com/file/d/${id}/view`,
    downloadUrl: type === 'folder'
      ? `https://drive.google.com/drive/folders/${id}`
      : `https://drive.google.com/uc?export=download&id=${id}`,
  };
}

export function normalizeAssetLink(value) {
  const url = getUrl(value);
  if (!url) {
    return {
      isValid: false,
      type: 'invalid',
      label: 'Invalid link',
      viewUrl: '',
      downloadUrl: '',
      id: '',
    };
  }

  const drive = parseGoogleDriveLink(value);
  if (drive) {
    return {
      isValid: true,
      type: drive.type === 'folder' ? 'drive-folder' : 'drive-file',
      label: drive.type === 'folder' ? 'Google Drive folder' : 'Google Drive file',
      viewUrl: drive.viewUrl,
      downloadUrl: drive.downloadUrl,
      id: drive.id,
    };
  }

  const isPdf = url.pathname.toLowerCase().endsWith('.pdf') || url.searchParams.toString().toLowerCase().includes('pdf');
  return {
    isValid: true,
    type: isPdf ? 'pdf' : 'link',
    label: isPdf ? 'PDF link' : 'External link',
    viewUrl: url.toString(),
    downloadUrl: url.toString(),
    id: '',
  };
}

export function openAssetLink(value, mode = 'view') {
  const link = normalizeAssetLink(value);
  if (!link.isValid) return false;
  const target = mode === 'download' ? link.downloadUrl : link.viewUrl;

  if (mode === 'download' && !isGoogleDriveUrl(target)) {
    const anchor = document.createElement('a');
    anchor.href = target;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download = '';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  }

  window.open(target, '_blank', 'noopener,noreferrer');
  return true;
}
