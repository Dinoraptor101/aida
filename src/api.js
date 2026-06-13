// Thin client for the Aida API.
const j = async (r) => {
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || r.statusText)
  return data
}

export const api = {
  health: () => fetch('/api/health').then(j),
  partners: () => fetch('/api/partners').then(j),
  partner: (id) => fetch(`/api/partners/${id}`).then(j),
  createPartner: (name, seedMessages) =>
    fetch('/api/partners', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, seedMessages }),
    }).then(j),
  read: (id, message) =>
    fetch(`/api/partners/${id}/read`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
    }).then(j),
  check: (id, draft) =>
    fetch(`/api/partners/${id}/check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ draft }),
    }).then(j),
  send: (id, text) =>
    fetch(`/api/partners/${id}/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    }).then(j),
}
