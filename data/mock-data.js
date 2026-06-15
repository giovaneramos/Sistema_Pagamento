(function () {
  const EP = (window.EVENTPAY = window.EVENTPAY || {});

  const now = Date.now();
  const hours = (value) => 1000 * 60 * 60 * value;

  const eventId = EP.uid('evt_');
  const secondEventId = EP.uid('evt_');

  const clients = [
    { id: EP.uid('cli_'), nome: 'Ana Martins', cpf: '123.456.789-10', telefone: '+55 11 98888-1201', email: 'ana@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Bruno Costa', cpf: '111.222.333-44', telefone: '+55 11 98888-1202', email: 'bruno@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Carla Souza', cpf: '555.666.777-88', telefone: '+55 11 98888-1203', email: 'carla@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Diego Lima', cpf: '999.000.111-22', telefone: '+55 11 98888-1204', email: 'diego@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Fernanda Alves', cpf: '222.333.444-55', telefone: '+55 11 98888-1205', email: 'fernanda@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Gustavo Nunes', cpf: '333.444.555-66', telefone: '+55 11 98888-1206', email: 'gustavo@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Helena Ribeiro', cpf: '444.555.666-77', telefone: '+55 11 98888-1207', email: 'helena@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Igor Santos', cpf: '777.888.999-00', telefone: '+55 11 98888-1208', email: 'igor@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Juliana Pereira', cpf: '101.202.303-40', telefone: '+55 11 98888-1209', email: 'juliana@eventpay.io' },
    { id: EP.uid('cli_'), nome: 'Marcos Vinicius', cpf: '909.808.707-60', telefone: '+55 11 98888-1210', email: 'marcos@eventpay.io' }
  ];

  const wallets = clients.map((client, index) => ({
    id: EP.uid('wal_'),
    clienteId: client.id,
    saldoAtual: 60 + (index * 18)
  }));

  const cards = clients.map((client, index) => ({
    id: EP.uid('card_'),
    clienteId: client.id,
    codigoNFC: `NFC-${String(index + 1).padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
    codigoQR: `QR-${String(index + 1).padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: index % 5 === 0 ? 'INATIVO' : 'ATIVO'
  }));

  const operators = [
    { id: EP.uid('op_'), nome: 'Admin Master', login: 'admin', perfil: 'Administrador' },
    { id: EP.uid('op_'), nome: 'Lucas Gerente', login: 'lucas', perfil: 'Gerente Evento' },
    { id: EP.uid('op_'), nome: 'Paula Caixa', login: 'paula', perfil: 'Caixa' },
    { id: EP.uid('op_'), nome: 'Rafa Operador', login: 'rafa', perfil: 'Operador PDV' },
    { id: EP.uid('op_'), nome: 'Auditoria Central', login: 'audit', perfil: 'Auditoria' }
  ];

  const terminals = Array.from({ length: 8 }).map((_, index) => ({
    id: EP.uid('term_'),
    nome: `Terminal ${String(index + 1).padStart(2, '0')}`,
    tipo: index < 4 ? 'ANDROID' : 'WEB',
    status: index === 6 ? 'OFFLINE' : 'ONLINE'
  }));

  const categories = ['Bebidas', 'Comidas', 'Snacks', 'Energia', 'Experiência'];
  const products = [
    { codigo: 'P001', descricao: 'Coca-Cola 350ml', categoria: 'Bebidas', valor: 12.0 },
    { codigo: 'P002', descricao: 'Água Mineral 500ml', categoria: 'Bebidas', valor: 6.0 },
    { codigo: 'P003', descricao: 'Hambúrguer Artesanal', categoria: 'Comidas', valor: 28.0 },
    { codigo: 'P004', descricao: 'Batata Frita', categoria: 'Snacks', valor: 18.0 },
    { codigo: 'P005', descricao: 'Cerveja Premium', categoria: 'Bebidas', valor: 16.0 },
    { codigo: 'P006', descricao: 'Snack Mix', categoria: 'Snacks', valor: 14.0 },
    { codigo: 'P007', descricao: 'Café Especial', categoria: 'Energia', valor: 10.0 },
    { codigo: 'P008', descricao: 'Acesso Lounge', categoria: 'Experiência', valor: 45.0 },
    { codigo: 'P009', descricao: 'Hot Dog', categoria: 'Comidas', valor: 22.0 },
    { codigo: 'P010', descricao: 'Suco Natural', categoria: 'Bebidas', valor: 11.0 }
  ].map((item, index) => ({
    id: EP.uid('prd_'),
    ...item,
    ativo: index !== 8
  }));

  const sales = [
    {
      id: EP.uid('sale_'),
      transactionId: EP.uid('tx_'),
      eventId,
      terminalId: terminals[0].id,
      operadorId: operators[2].id,
      clienteId: clients[0].id,
      valor: 46,
      createdAt: new Date(now - hours(7)).toISOString(),
      syncStatus: 'SYNCED',
      items: [
        { id: EP.uid('item_'), produtoId: products[0].id, quantidade: 2, valorUnitario: 12 },
        { id: EP.uid('item_'), produtoId: products[2].id, quantidade: 1, valorUnitario: 22 }
      ]
    },
    {
      id: EP.uid('sale_'),
      transactionId: EP.uid('tx_'),
      eventId,
      terminalId: terminals[1].id,
      operadorId: operators[3].id,
      clienteId: clients[1].id,
      valor: 36,
      createdAt: new Date(now - hours(5)).toISOString(),
      syncStatus: 'PENDING',
      items: [
        { id: EP.uid('item_'), produtoId: products[4].id, quantidade: 2, valorUnitario: 16 },
        { id: EP.uid('item_'), produtoId: products[1].id, quantidade: 1, valorUnitario: 4 }
      ]
    }
  ];

  const recargas = [
    {
      id: EP.uid('rec_'),
      transactionId: EP.uid('tx_'),
      eventId,
      terminalId: terminals[2].id,
      operadorId: operators[2].id,
      clienteId: clients[2].id,
      valor: 100,
      formaPagamento: 'PIX',
      createdAt: new Date(now - hours(10)).toISOString(),
      syncStatus: 'SYNCED'
    },
    {
      id: EP.uid('rec_'),
      transactionId: EP.uid('tx_'),
      eventId,
      terminalId: terminals[3].id,
      operadorId: operators[2].id,
      clienteId: clients[3].id,
      valor: 80,
      formaPagamento: 'CARTAO',
      createdAt: new Date(now - hours(4)).toISOString(),
      syncStatus: 'PENDING'
    }
  ];

  const estornos = [
    {
      id: EP.uid('est_'),
      transactionId: EP.uid('tx_'),
      eventId,
      terminalId: terminals[4].id,
      operadorId: operators[1].id,
      clienteId: clients[4].id,
      motivo: 'Pedido cancelado',
      valor: 22,
      createdAt: new Date(now - hours(2)).toISOString(),
      syncStatus: 'SYNCED'
    }
  ];

  const syncs = [
    {
      id: EP.uid('sync_'),
      transactionId: sales[0].transactionId,
      entity: 'VENDA',
      status: 'SYNCED',
      data: new Date(now - hours(6)).toISOString(),
      deviceId: 'demo-device-01',
      terminalId: terminals[0].id,
      eventId
    },
    {
      id: EP.uid('sync_'),
      transactionId: sales[1].transactionId,
      entity: 'VENDA',
      status: 'PENDING',
      data: new Date(now - hours(4)).toISOString(),
      deviceId: 'demo-device-02',
      terminalId: terminals[1].id,
      eventId
    }
  ];

  const events = [
    {
      id: eventId,
      nome: 'Summer Beats 2026',
      dataInicio: '2026-06-20',
      dataFim: '2026-06-22',
      local: 'São Paulo Expo',
      status: 'ATIVO'
    },
    {
      id: secondEventId,
      nome: 'Food Tech Night',
      dataInicio: '2026-09-04',
      dataFim: '2026-09-05',
      local: 'Belo Horizonte',
      status: 'PLANEJADO'
    }
  ];

  EP.seedData = {
    events,
    clients,
    wallets,
    cards,
    operators,
    terminals,
    products,
    sales,
    recargas,
    estornos,
    syncs,
    ui: {
      route: 'dashboard-executivo',
      selectedClientId: clients[0].id,
      selectedEventId: eventId,
      selectedTerminalId: terminals[0].id,
      currentUserId: operators[0].id,
      currentProfile: 'Administrador',
      terminalMode: 'HIBRIDO',
      online: true,
      localServerOnline: true,
      cloudOnline: true
    },
    session: {
      loggedIn: true,
      operatorId: operators[0].id,
      profile: 'Administrador'
    },
    settings: {
      appMode: 'DEMO',
      eventName: 'Summer Beats 2026',
      autoSync: true,
      syncIntervalMs: 8000
    }
  };
})();
