VANTA.BIRDS({
  el: "#birds-canvas",
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 200.00,
  minWidth: 200.00,
  scale: 1.00,
  scaleMobile: 1.00,
  backgroundColor: 0xffffff,
  backgroundAlpha: 0,
  quantity: 3.00
});

hljs.initHighlightingOnLoad();

if($('#blog-toc').length) {
  tocbot.init({
      tocSelector: '#blog-toc',
      contentSelector: '.blog-content',
      headingSelector: 'h1, h2, h3',
      hasInnerContainers: true,
      positionFixedSelector: '#blog-toc'
    });
}

$(document).ready(function() {
  $(".navbar-burger").click(function() {
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
  });
});

