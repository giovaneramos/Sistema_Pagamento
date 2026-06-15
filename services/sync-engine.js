(function () {
  const EP = (window.EVENTPAY = window.EVENTPAY || {});

  class SyncEngine {
    constructor({ getState, setState, saveLedger, saveMaster, onNotify }) {
      this.getState = getState;
      this.setState = setState;
      this.saveLedger = saveLedger;
      this.saveMaster = saveMaster;
      this.onNotify = onNotify;
      this.timer = null;
      this.running = false;
    }

    start() {
      if (this.timer) return;
      this.timer = window.setInterval(() => this.processPending(), this.getState().settings.syncIntervalMs || 8000);
    }

    stop() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    async enqueueSync(entry) {
      const state = this.getState();
      const syncItem = {
        id: EP.uid('sync_'),
        transactionId: entry.transactionId,
        entity: entry.entity,
        status: entry.status || (state.ui.online ? 'SYNCED' : 'PENDING'),
        data: new Date().toISOString(),
        deviceId: entry.deviceId || 'demo-device',
        terminalId: entry.terminalId,
        eventId: entry.eventId,
        details: entry.details || {}
      };

      const syncs = [...state.syncs, syncItem];
      this.setState({ syncs });
      await this.saveLedger({
        sales: state.sales,
        recargas: state.recargas,
        estornos: state.estornos,
        syncs
      });
      return syncItem;
    }

    async processPending() {
      const state = this.getState();
      if (!state.ui.online) {
        return { processed: 0, message: 'Sem rede, fila mantida em PENDING.' };
      }

      if (this.running) {
        return { processed: 0, message: 'Sincronização já em execução.' };
      }

      this.running = true;
      const changedSyncs = [];
      let processed = 0;
      const syncs = state.syncs.map((sync) => {
        if (sync.status === 'SYNCED') return sync;
        processed += 1;
        const status = sync.status === 'CONFLICT' ? 'CONFLICT' : 'SYNCED';
        const next = { ...sync, status, data: new Date().toISOString() };
        changedSyncs.push(next);
        return next;
      });

      this.setState({ syncs });
      await this.saveLedger({
        sales: state.sales,
        recargas: state.recargas,
        estornos: state.estornos,
        syncs
      });
      this.running = false;

      if (processed > 0 && this.onNotify) {
        this.onNotify('Sincronização concluída', `${processed} registro(s) processado(s) com sucesso.`);
      }

      return { processed, changedSyncs };
    }

    async markConflict(transactionId, reason) {
      const state = this.getState();
      const syncs = state.syncs.map((sync) =>
        sync.transactionId === transactionId ? { ...sync, status: 'CONFLICT', details: { ...(sync.details || {}), reason } } : sync
      );
      this.setState({ syncs });
      await this.saveLedger({
        sales: state.sales,
        recargas: state.recargas,
        estornos: state.estornos,
        syncs
      });
    }
  }

  EP.SyncEngine = SyncEngine;
})();
