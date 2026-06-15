(function () {
  const EP = (window.EVENTPAY = window.EVENTPAY || {});

  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const dateTime = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });

  const dateOnly = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium'
  });

  EP.uid = (prefix = '') => {
    if (window.crypto && crypto.randomUUID) {
      return `${prefix}${crypto.randomUUID()}`;
    }
    return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  };

  EP.formatCurrency = (value) => currency.format(Number(value || 0));
  EP.formatDateTime = (value) => dateTime.format(new Date(value));
  EP.formatDate = (value) => dateOnly.format(new Date(value));
  EP.safeText = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  EP.sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) || 0), 0);
  EP.groupBy = (items, selector) => items.reduce((acc, item) => {
    const key = selector(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
  EP.clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  EP.hashText = (text) => {
    let hash = 0;
    const source = String(text || '');
    for (let i = 0; i < source.length; i += 1) {
      hash = (hash << 5) - hash + source.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  EP.generateQrMatrix = (text, size = 21) => {
    const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
    const hash = EP.hashText(text);

    const paintFinder = (x, y) => {
      for (let row = 0; row < 7; row += 1) {
        for (let col = 0; col < 7; col += 1) {
          const border = row === 0 || row === 6 || col === 0 || col === 6;
          const center = row >= 2 && row <= 4 && col >= 2 && col <= 4;
          matrix[y + row][x + col] = border || center;
        }
      }
    };

    paintFinder(0, 0);
    paintFinder(size - 7, 0);
    paintFinder(0, size - 7);

    let cursor = 0;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const reserved = (row < 7 && col < 7) || (row < 7 && col >= size - 7) || (row >= size - 7 && col < 7);
        if (reserved) continue;
        const bit = ((hash >> (cursor % 31)) ^ (cursor * 13)) & 1;
        matrix[row][col] = bit === 1;
        cursor += 1;
      }
    }

    return matrix;
  };

  EP.renderQrHtml = (text) => {
    const matrix = EP.generateQrMatrix(text);
    return `
      <div class="qr-frame" aria-label="QR Code simulado">
        ${matrix.map((row) => row.map((cell) => `<span style="background:${cell ? '#0b1020' : '#fff'}"></span>`).join('')).join('')}
      </div>
    `;
  };

  EP.money = (value) => EP.formatCurrency(value).replace(/\u00a0/g, ' ');
})();
