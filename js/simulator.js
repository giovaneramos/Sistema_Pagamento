(function () {
  const frame = document.getElementById('screenFrame');
  const buttons = document.querySelectorAll('[data-screen]');
  const routes = {
    'caixa-recarga': './index.html?compact=1&v=8#caixa-recarga',
    pdv: './index.html?compact=1&v=8#pdv'
  };

  const setScreen = (screen) => {
    frame.src = routes[screen];
    buttons.forEach((button) => {
      button.classList.toggle('active', button.dataset.screen === screen);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => setScreen(button.dataset.screen));
  });

  setScreen('caixa-recarga');
})();
