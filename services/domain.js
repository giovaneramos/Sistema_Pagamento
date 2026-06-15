(function () {
  const EP = (window.EVENTPAY = window.EVENTPAY || {});

  const findById = (items, id) => items.find((item) => item.id === id);

  const getWalletByClient = (state, clientId) => state.wallets.find((wallet) => wallet.clienteId === clientId);

  const getCardByClient = (state, clientId) => state.cards.find((card) => card.clienteId === clientId);

  const getClientByCardCode = (state, code) => {
    const card = state.cards.find((item) => item.codigoNFC === code || item.codigoQR === code);
    return card ? { card, clientId: card.clienteId } : null;
  };

  const currentEvent = (state) => findById(state.events, state.ui.selectedEventId) || state.events[0];
  const currentTerminal = (state) => findById(state.terminals, state.ui.selectedTerminalId) || state.terminals[0];

  const formatProductLines = (state, items) =>
    items.map((item) => {
      const product = findById(state.products, item.produtoId);
      return {
        ...item,
        descricao: product ? product.descricao : 'Produto removido',
        categoria: product ? product.categoria : 'N/A'
      };
    });

  const createTransactionMeta = (state, extra = {}) => ({
    transactionId: EP.uid('tx_'),
    deviceId: extra.deviceId || 'demo-device-01',
    terminalId: extra.terminalId || currentTerminal(state)?.id,
    eventId: extra.eventId || currentEvent(state)?.id,
    createdAt: new Date().toISOString(),
    syncStatus: state.ui.online ? 'SYNCED' : 'PENDING'
  });

  const recalculateMetrics = (state) => {
    const salesTotal = EP.sum(state.sales, (sale) => sale.valor);
    const salesCount = state.sales.length;
    const openBalance = EP.sum(state.wallets, (wallet) => wallet.saldoAtual);
    const avgTicket = salesCount ? salesTotal / salesCount : 0;

    const productRanking = {};
    state.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        productRanking[item.produtoId] = (productRanking[item.produtoId] || 0) + Number(item.quantidade || 0);
      });
    });

    const operatorRanking = {};
    const terminalRanking = {};
    state.sales.forEach((sale) => {
      operatorRanking[sale.operadorId] = (operatorRanking[sale.operadorId] || 0) + 1;
      terminalRanking[sale.terminalId] = (terminalRanking[sale.terminalId] || 0) + 1;
    });

    const topProducts = Object.entries(productRanking)
      .map(([id, quantity]) => ({ id, quantity, produto: findById(state.products, id) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const topOperators = Object.entries(operatorRanking)
      .map(([id, quantity]) => ({ id, quantity, operador: findById(state.operators, id) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const topTerminals = Object.entries(terminalRanking)
      .map(([id, quantity]) => ({ id, quantity, terminal: findById(state.terminals, id) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      salesTotal,
      salesCount,
      openBalance,
      avgTicket,
      topProducts,
      topOperators,
      topTerminals
    };
  };

  EP.domain = {
    currentEvent,
    currentTerminal,
    getWalletByClient,
    getCardByClient,
    getClientByCardCode,
    formatProductLines,
    recalculateMetrics,

    buildExecutiveMetrics(state) {
      return recalculateMetrics(state);
    },

    buildOperationalMetrics(state) {
      const syncPending = state.syncs.filter((sync) => sync.status === 'PENDING').length;
      const syncFailed = state.syncs.filter((sync) => sync.status === 'FAILED').length;
      const syncConflict = state.syncs.filter((sync) => sync.status === 'CONFLICT').length;
      const online = state.terminals.filter((terminal) => terminal.status === 'ONLINE').length;
      const offline = state.terminals.filter((terminal) => terminal.status === 'OFFLINE').length;

      return {
        online,
        offline,
        queue: syncPending,
        failed: syncFailed,
        conflicts: syncConflict,
        alerts: (syncFailed + syncConflict + offline),
        totalTerminals: state.terminals.length
      };
    },

    async createRecharge({ state, setState, storage, syncEngine, payload }) {
      const client = findById(state.clients, payload.clienteId);
      const wallet = getWalletByClient(state, payload.clienteId);
      if (!client || !wallet) {
        throw new Error('Cliente ou carteira não encontrada.');
      }

      const amount = Number(payload.valor || 0);
      const recharge = {
        id: EP.uid('rec_'),
        ...createTransactionMeta(state, payload),
        clienteId: payload.clienteId,
        operadorId: payload.operadorId,
        valor: amount,
        formaPagamento: payload.formaPagamento || 'PIX'
      };

      const recargas = [recharge, ...state.recargas];
      const wallets = state.wallets.map((item) =>
        item.id === wallet.id ? { ...item, saldoAtual: Number(item.saldoAtual) + amount } : item
      );
      const syncStatus = recharge.syncStatus;
      const syncRecord = await syncEngine.enqueueSync({
        transactionId: recharge.transactionId,
        entity: 'RECARGA',
        status: syncStatus,
        terminalId: recharge.terminalId,
        eventId: recharge.eventId,
        details: { valor: amount, clienteId: payload.clienteId }
      });

      const updatedRecharge = { ...recharge, syncStatus: syncRecord.status };
      const updatedRecargas = [updatedRecharge, ...state.recargas];

      setState({ recargas: updatedRecargas, wallets });
      await storage.putRecord('recargas', updatedRecharge);
      await storage.saveMaster({
        ...state,
        recargas: updatedRecargas,
        wallets
      });

      return updatedRecharge;
    },

    async createSale({ state, setState, storage, syncEngine, payload }) {
      const client = findById(state.clients, payload.clienteId);
      const wallet = getWalletByClient(state, payload.clienteId);
      if (!client || !wallet) {
        throw new Error('Cliente ou carteira não encontrada.');
      }

      const items = formatProductLines(state, payload.items || []);
      const total = items.reduce((sum, item) => sum + Number(item.quantidade || 0) * Number(item.valorUnitario || 0), 0);
      if (total <= 0) {
        throw new Error('Carrinho vazio.');
      }
      if (wallet.saldoAtual < total) {
        throw new Error('Saldo insuficiente para esta venda.');
      }

      const sale = {
        id: EP.uid('sale_'),
        ...createTransactionMeta(state, payload),
        clienteId: payload.clienteId,
        operadorId: payload.operadorId,
        valor: total,
        items: items.map((item) => ({
          id: EP.uid('item_'),
          produtoId: item.produtoId,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario)
        }))
      };

      const sales = [sale, ...state.sales];
      const wallets = state.wallets.map((item) =>
        item.id === wallet.id ? { ...item, saldoAtual: Number(item.saldoAtual) - total } : item
      );

      const syncRecord = await syncEngine.enqueueSync({
        transactionId: sale.transactionId,
        entity: 'VENDA',
        status: sale.syncStatus,
        terminalId: sale.terminalId,
        eventId: sale.eventId,
        details: { valor: total, clienteId: payload.clienteId, items: sale.items }
      });

      const updatedSale = { ...sale, syncStatus: syncRecord.status };
      const updatedSales = [updatedSale, ...state.sales];

      setState({ sales: updatedSales, wallets });
      await storage.putRecord('sales', updatedSale);
      await storage.saveMaster({
        ...state,
        sales: updatedSales,
        wallets
      });

      return updatedSale;
    },

    async createRefund({ state, setState, storage, syncEngine, payload }) {
      const amount = Number(payload.valor || 0);
      const refund = {
        id: EP.uid('est_'),
        ...createTransactionMeta(state, payload),
        clienteId: payload.clienteId,
        operadorId: payload.operadorId,
        valor: amount,
        motivo: payload.motivo || 'Estorno manual'
      };

      const syncRecord = await syncEngine.enqueueSync({
        transactionId: refund.transactionId,
        entity: 'ESTORNO',
        status: refund.syncStatus,
        terminalId: refund.terminalId,
        eventId: refund.eventId,
        details: { valor: amount, motivo: refund.motivo }
      });

      const updatedRefund = { ...refund, syncStatus: syncRecord.status };
      const estornos = [updatedRefund, ...state.estornos];

      setState({ estornos });
      await storage.putRecord('estornos', updatedRefund);
      await storage.saveMaster({
        ...state,
        estornos
      });

      return updatedRefund;
    }
  };
})();
