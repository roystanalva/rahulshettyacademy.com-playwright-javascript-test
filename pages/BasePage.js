class BasePage {
  constructor(page) {
    this.page = page;
  }
  async goto(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }
  async title() {
    return this.page.title();
  }
}
module.exports = { BasePage };
