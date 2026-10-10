const { BasePage } = require('./BasePage');

class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.locator('h1, h2').first();
    this.navLinks = page.locator('header a[href], nav a[href]');
    this.allLinks = page.locator('a[href]');
    this.images = page.locator('img');
    this.footer = page.locator('footer').first();
  }
  open() {
    return this.goto('/');
  }
  async allHrefs() {
    return this.allLinks.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  }
}
module.exports = { HomePage };
