const { BasePage } = require('./BasePage');
const env = require('../config/env');

// https://rahulshettyacademy.com/client  (login + registration)
class ClientAuthPage extends BasePage {
  constructor(page) {
    super(page);
    this.email = page.locator('#userEmail');
    this.password = page.locator('#userPassword');
    this.loginBtn = page.locator('#login');
    this.registerLink = page.locator('.btn1, a[routerlink*="register"]').first();
    this.firstName = page.locator('#firstName');
    this.lastName = page.locator('#lastName');
    this.phone = page.locator('#userMobile');
    this.occupation = page.locator('select[formcontrolname="occupation"]');
    this.confirmPassword = page.locator('#confirmPassword');
    this.ageCheck = page.locator('input[type="checkbox"]');
    this.validationMsgs = page.locator('.invalid-feedback, .text-danger');
    this.toast = page.locator('#toast-container, .toast-message');
  }
  openLogin() {
    return this.goto(env.paths.clientLogin);
  }
  openRegister() {
    return this.goto(env.paths.clientRegister);
  }
  async login(email, password) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.loginBtn.click();
  }
  async fillRegistration(u, { check = true } = {}) {
    await this.firstName.fill(u.firstName);
    await this.lastName.fill(u.lastName);
    await this.email.fill(u.email);
    await this.phone.fill(u.phone);
    if (u.occupation) await this.occupation.selectOption({ label: u.occupation }).catch(() => {});
    if (u.gender) await this.page.locator(`input[type="radio"][value="${u.gender}"]`).check().catch(() => {});
    await this.password.fill(u.password);
    await this.confirmPassword.fill(u.confirmPassword ?? u.password);
    if (check) await this.ageCheck.check().catch(() => {});
  }
  submit() {
    return this.loginBtn.click();
  }
}
module.exports = { ClientAuthPage };
