/* EventHub registration page behaviour. */
(function () {
  const R = window.EventHubRules;
  const TOKEN_KEY = 'eventhub.token';
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    location.replace('/');
    return;
  }

  const $ = (id) => document.getElementById(id);
  const form = $('registration-form');
  const formAlert = $('form-alert');
  const submitButton = $('submit-button');
  const spinner = $('submit-spinner');
  const dialog = $('confirm-dialog');
  const tableBody = $('registrations-body');
  const emptyState = $('empty-state');
  const filterInput = $('filter');

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let documentMeta = null;
  let photoMeta = null;
  let registrations = [];
  const touched = new Set();

  // ---------- helpers ----------
  function formatDate(iso) {
    const d = R.parseIsoDate(iso);
    if (!d) return iso;
    return `${DAYS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  const formatMoney = (amount) => `€${Number(amount).toFixed(2)}`;
  const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`);
  const ticketLabel = (code) => (R.TICKET_TYPES.find((t) => t.code === code) || {}).label || code;

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      location.replace('/');
      throw new Error('Session expired');
    }
    const data = res.status === 204 ? null : await res.json();
    return { status: res.status, data };
  }

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = message;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function setFieldError(field, message) {
    const input = $(field);
    const error = $(`${field}-error`);
    error.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function formValues() {
    return {
      fullName: form.fullName.value,
      email: form.email.value,
      age: form.age.value,
      tickets: form.tickets.value,
      ticketType: form.ticketType.value,
      eventDate: form.eventDate.value,
      notes: form.notes.value,
    };
  }

  function validateField(field) {
    const message = R.fieldValidators[field](formValues()[field]);
    setFieldError(field, message);
    return message;
  }

  // ---------- setup ----------
  for (const type of R.TICKET_TYPES) {
    const option = document.createElement('option');
    option.value = type.code;
    option.textContent = `${type.label} (${formatMoney(type.price)})`;
    form.ticketType.appendChild(option);
  }
  form.age.min = R.LIMITS.ageMin;
  form.age.max = R.LIMITS.ageMax;
  form.tickets.min = R.LIMITS.ticketsMin;
  form.tickets.max = R.LIMITS.ticketsMax;
  const window_ = R.dateWindow();
  form.eventDate.min = window_.min;
  form.eventDate.max = window_.max;

  // ---------- dynamic behaviour ----------
  function updateTotal() {
    $('total-price').textContent = `Total: ${formatMoney(R.priceFor(form.ticketType.value, Number(form.tickets.value)))}`;
  }

  function updateCounter() {
    const length = form.notes.value.length;
    const counter = $('notes-counter');
    counter.textContent = `${length} / ${R.LIMITS.notesMax}`;
    counter.classList.toggle('over', length > R.LIMITS.notesMax);
    validateField('notes');
  }

  form.tickets.addEventListener('input', updateTotal);
  form.ticketType.addEventListener('change', updateTotal);
  form.notes.addEventListener('input', updateCounter);

  for (const field of Object.keys(R.fieldValidators)) {
    $(field).addEventListener('blur', () => {
      touched.add(field);
      validateField(field);
    });
    $(field).addEventListener('input', () => {
      if (touched.has(field)) validateField(field);
    });
  }

  form.document.addEventListener('change', () => {
    const file = form.document.files[0];
    documentMeta = null;
    $('document-status').textContent = '';
    if (!file) return setFieldError('document', '');
    const meta = { name: file.name, size: file.size, type: file.type };
    const error = R.validateDocument(meta);
    setFieldError('document', error);
    if (error) {
      form.document.value = '';
      return;
    }
    documentMeta = meta;
    $('document-status').textContent = `Uploaded: ${file.name} (${formatSize(file.size)})`;
  });

  form.photo.addEventListener('change', () => {
    const file = form.photo.files[0];
    photoMeta = null;
    $('photo-preview').hidden = true;
    if (!file) return setFieldError('photo', '');
    const meta = { name: file.name, size: file.size, type: file.type };
    const error = R.validatePhoto(meta);
    if (error) {
      setFieldError('photo', error);
      form.photo.value = '';
      return;
    }
    // Decode the image to make sure the content really is a picture.
    const url = URL.createObjectURL(file);
    const img = $('photo-img');
    img.onload = () => {
      photoMeta = { ...meta, width: img.naturalWidth, height: img.naturalHeight };
      setFieldError('photo', '');
      $('photo-status').textContent = `${file.name} · ${img.naturalWidth}×${img.naturalHeight} px`;
      $('photo-preview').hidden = false;
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setFieldError('photo', 'The file is not a valid image');
      form.photo.value = '';
    };
    img.src = url;
  });

  filterInput.addEventListener('input', renderList);

  $('sign-out').addEventListener('click', () => {
    sessionStorage.removeItem(TOKEN_KEY);
    location.assign('/');
  });

  // ---------- submission ----------
  function buildPayload() {
    const v = formValues();
    return {
      fullName: v.fullName.trim(),
      email: v.email.trim(),
      age: Number(v.age),
      tickets: Number(v.tickets),
      ticketType: v.ticketType,
      eventDate: v.eventDate,
      notes: v.notes,
      document: documentMeta,
      photo: photoMeta,
    };
  }

  function showFormAlert(message) {
    formAlert.textContent = message;
    formAlert.hidden = !message;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    showFormAlert('');
    const failing = Object.keys(R.fieldValidators).filter((field) => validateField(field));
    Object.keys(R.fieldValidators).forEach((f) => touched.add(f));
    if (failing.length) {
      showFormAlert(`Please fix ${failing.length} error${failing.length > 1 ? 's' : ''} before submitting`);
      $(failing[0]).focus();
      return;
    }
    const p = buildPayload();
    $('confirm-summary').innerHTML = '';
    const rows = [
      ['Name', p.fullName],
      ['Email', p.email],
      ['Ticket', `${ticketLabel(p.ticketType)} × ${p.tickets}`],
      ['Date', formatDate(p.eventDate)],
      ['Total', formatMoney(R.priceFor(p.ticketType, p.tickets))],
    ];
    for (const [term, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = term;
      const dd = document.createElement('dd');
      dd.textContent = value;
      $('confirm-summary').append(dt, dd);
    }
    dialog.showModal();
  });

  $('confirm-cancel').addEventListener('click', () => dialog.close('cancel'));

  $('confirm-ok').addEventListener('click', async () => {
    dialog.close('confirm');
    submitButton.disabled = true;
    spinner.hidden = false;
    try {
      const { status, data } = await api('POST', '/api/registrations', buildPayload());
      if (status === 201) {
        toast(`Registration confirmed: ${data.reference}`);
        form.reset();
        documentMeta = null;
        photoMeta = null;
        touched.clear();
        $('document-status').textContent = '';
        $('photo-preview').hidden = true;
        updateTotal();
        updateCounter();
        await loadList();
      } else if (status === 409) {
        showFormAlert(data.error);
        setFieldError('email', 'This email is already registered');
      } else if (status === 400) {
        data.details.forEach((d) => setFieldError(d.field, d.message));
        showFormAlert(`Please fix ${data.details.length} error${data.details.length > 1 ? 's' : ''} before submitting`);
      } else {
        showFormAlert('Something went wrong. Please try again.');
      }
    } finally {
      submitButton.disabled = false;
      spinner.hidden = true;
    }
  });

  // ---------- list ----------
  function renderList() {
    const needle = filterInput.value.trim().toLowerCase();
    const visible = registrations.filter((r) => r.email.includes(needle));
    tableBody.innerHTML = '';
    for (const r of visible) {
      const tr = document.createElement('tr');
      tr.dataset.reference = r.reference;
      const cells = [r.reference, r.fullName, r.email, ticketLabel(r.ticketType), r.tickets, formatDate(r.eventDate), formatMoney(r.totalPrice)];
      for (const value of cells) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      }
      const actions = document.createElement('td');
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'danger';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', `Delete registration ${r.reference}`);
      del.addEventListener('click', () => deleteRegistration(r));
      actions.appendChild(del);
      tr.appendChild(actions);
      tableBody.appendChild(tr);
    }
    emptyState.hidden = visible.length > 0;
    emptyState.textContent = registrations.length ? 'No registrations match the filter.' : 'No registrations yet.';
  }

  async function loadList() {
    const { data } = await api('GET', '/api/registrations');
    registrations = data.items;
    renderList();
  }

  async function deleteRegistration(r) {
    if (!window.confirm(`Delete registration ${r.reference}? This cannot be undone.`)) return;
    const { status } = await api('DELETE', `/api/registrations/${r.id}`);
    if (status === 204 || status === 404) {
      toast(`Registration ${r.reference} deleted`);
      await loadList();
    }
  }

  updateTotal();
  loadList();
})();
