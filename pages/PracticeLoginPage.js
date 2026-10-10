const { BasePage } = require('./BasePage');
const env = require('../config/env');

// https://rahulshettyacademy.com/loginpagePractice/
class PracticeLoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.signIn = page.locator('#signInBtn');
    this.terms = page.locator('#terms');
    this.error = page.locator('.alert-danger');
    this.userRadio = page.locator('.radiotextsty').last();
    this.okayBtn = page.locator('#okayBtn');
    this.roleSelect = page.locator('select.form-control');
  }
  open() {
    return this.goto(env.paths.practiceLogin);
  }
  async login(user, pass, { acceptTerms = true } = {}) {
    await this.username.fill(user);
    await this.password.fill(pass);
    if (acceptTerms) await this.terms.check();
    await this.signIn.click();
  }
}
module.exports = { PracticeLoginPage };
