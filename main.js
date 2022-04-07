require('dotenv').config();
const fs = require('fs');
const puppeteer = require('puppeteer');
const chalk = require('chalk');

// config

const username = 'fredrikeklundny';
const message = 'Hello';
const dms = 30;

// variables used in code

const followersSelector =
  '#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > div';
const userSelector =
  'body > div.RnEpo.Yx5HN > div > div > div.qF0y9.Igw0E.IwRSH.eGOV_.vwCYk.i0EQd > div.qF0y9.Igw0E.IwRSH.eGOV_.vwCYk._3wFWr > div:nth-child(1)';
const nextButton =
  'body > div.RnEpo.Yx5HN > div > div > div:nth-child(1) > div > div.WaOAr._8E02J > div > button';
const inputPath =
  '#react-root > section > div > div.qF0y9.Igw0E.IwRSH.eGOV_._4EzTm > div > div > div.DPiy6.qF0y9.Igw0E.IwRSH.eGOV_.vwCYk > div.uueGX > div > div.qF0y9.Igw0E.IwRSH.eGOV_._4EzTm > div > div > div.qF0y9.Igw0E.IwRSH.eGOV_.vwCYk.ItkAi > textarea';
const sendPath =
  '#react-root > section > div > div.qF0y9.Igw0E.IwRSH.eGOV_._4EzTm > div > div > div.DPiy6.qF0y9.Igw0E.IwRSH.eGOV_.vwCYk > div.uueGX > div > div.qF0y9.Igw0E.IwRSH.eGOV_._4EzTm > div > div > div.qF0y9.Igw0E.IwRSH.eGOV_._4EzTm.JI_ht > button';
const scrolls = Math.ceil(dms / 12);
const usersToDm = [];

const getUsers = () => {
  return new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--start-maximized'],
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1600,
      height: 900,
    });
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.instagram.com/accounts/login/');
    await page.waitForSelector('input[name=username]');
    await page.type('input[name=username]', process.env.EMAIL);
    await page.type('input[name=password]', process.env.PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForNavigation();
    await page.goto(`https://www.instagram.com/${username}/`);
    await page.waitForSelector(followersSelector);
    await page.click(followersSelector);
    await page.waitForTimeout(4000);
    for (let i = 0; i < scrolls; i++) {
      if (i !== 0) {
        await page.waitForTimeout(i * 2000);
      }
      const arr = await page.evaluate(() => {
        const arr = [];
        const users = document.querySelectorAll(
          '._7UhW9.xLCgt.qyrsm.KV-D4.se6yk.T0kll'
        );
        const popup = document.querySelector('.isgrP');

        users.forEach((user) => {
          arr.push(user.innerText);
        });

        popup.scrollTo(0, popup.scrollHeight);

        return arr;
      });
      arr.forEach((id) => {
        if (!usersToDm.includes(id)) {
          usersToDm.push(id);
        }
      });
    }
    fs.writeFileSync('.igbot', JSON.stringify(usersToDm), 'utf8');
    await browser.close();
    resolve();
  });
};

const getIds = () => {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync('.igbot', 'utf-8');
    resolve(JSON.parse(data));
  });
};

const massDm = (ids) => {
  return new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--start-maximized'],
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1600,
      height: 900,
    });
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.instagram.com/accounts/login/');
    await page.waitForSelector('input[name=username]');
    await page.type('input[name=username]', process.env.EMAIL);
    await page.type('input[name=password]', process.env.PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForNavigation();
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (i !== 0) {
        await page.waitForTimeout(i * 3000);
      }
      await page.goto('https://www.instagram.com/direct/new/');
      await page.type('input.j_2Hd', id);
      await page.waitForTimeout(2000);
      await page.evaluate((userSelector) => {
        const cancelPopup = document.querySelector('.aOOlW.HoLwm');
        const user = document.querySelector(userSelector);
        if (cancelPopup) {
          cancelPopup.click();
        }
        if (user) {
          user.click();
        } else {
          return false;
        }
      }, userSelector);
      try {
        await page.click(nextButton);
        await page.waitForTimeout(2000);
        await page.type(inputPath, message);
        await page.click(sendPath);
      } catch (error) {
        console.log(
          chalk.red.bold(
            `Error, see the screenshot at ./errors/${i}.png (most likely the account was not found)`
          )
        );
        await page.screenshot({
          path: `./errors/${i}.png`,
          fullPage: true,
        });
      }
    }
    await browser.close();
    resolve();
  });
};

// main code

const main = async () => {
  await getUsers();
  console.log(chalk.green.bold('Got the users now mass dming'));
  console.log(chalk.green.bold('Trying to dm...'));
  setTimeout(async () => {
    const ids = await getIds();
    await massDm(ids);
    console.log(chalk.green.bold('Done :)'));
  }, 2000);
};

main();
