/* global window, document */
import { h } from './component/element';
import DataProxy from './core/data_proxy';
import Sheet from './component/sheet';
import Bottombar from './component/bottombar';
import { cssPrefix } from './config';
import { locale } from './locale/locale';
import './index.less';


class Spreadsheet {
  constructor(selectors, options = {}) {

    console.log("fork")
    let targetEl = selectors;
    this.options = { showBottomBar: true, ...options };
    this.sheetIndex = 1;
    this.activeIndex = 0;
    this.datas = [];
    if (typeof selectors === 'string') {
      targetEl = document.querySelector(selectors);
    }
    this.bottombar = this.options.showBottomBar ? new Bottombar(() => {
      if (this.options.mode === 'read') return;
      const d = this.addSheet();
      this.sheet.resetData(d);
    }, (index) => {
      const d = this.datas[index];
      this.sheet.resetData(d);
      this.sheet.trigger('change', { eventType: 'swapFunc', sheetIndex: index });
    }, () => {
      this.deleteSheet();
    }, (index, value) => {
      this.datas[index].name = value;
      this.sheet.trigger('change', { eventType: 'updateFunc' });
    }) : null;
    this.data = this.addSheet();
    const rootEl = h('div', `${cssPrefix}`)
      .on('contextmenu', evt => evt.preventDefault());
    // create canvas element
    targetEl.appendChild(rootEl.el);
    this.sheet = new Sheet(rootEl, this.data);
    if (this.bottombar !== null) {
      rootEl.child(this.bottombar.el);
    }


  }

  addSheet(name, active = true) {
    const n = name || `sheet${this.sheetIndex}`;
    const d = new DataProxy(n, this.options);
    d.change = (...args) => {
      this.sheet.trigger('change', ...args);
    };
    this.datas.push(d);
    // console.log('d:', n, d, this.datas);
    if (this.bottombar !== null) {
      this.bottombar.addItem(n, active, this.options);
    }
    this.sheetIndex += 1;
    return d;
  }

  getCurrentSheetIndex() {
    const allTabs = this.bottombar.getAllTabs();
    console.log("whazzup");
    console.log('All tabs', allTabs);
    for (let i = 0; i < allTabs.length; i++) {
      console.log('Element of all tabs', allTabs[i].el)
      if (allTabs[i].el.classList.contains('active')) {
        return i
      }
    }
  }


  addListeners() {
    const allTabs = this.bottombar.getAllTabs();
    allTabs.forEach((tab, index) => {
      tab.on('click', () => {
        console.log("index", index)
        this.activeIndex = index;
        this.sheet.trigger('change', { sheetIndex: index, eventType: 'tabClick' });
        const activeTabItem = this.bottombar.getItemByIndex(index)
        this.bottombar.clickSwap2(activeTabItem);
      });
    });
  }

  changeSheet(name) {
    this.sheet.trigger('change', name);
  }

  createTempSheet(data) {
    const d = new DataProxy(data.name, this.options);
    d.change = (...args) => {
      this.sheet.trigger('change', ...args);
    };
  }

  deleteSheet() {
    if (this.bottombar === null) return;

    const [oldIndex, nindex] = this.bottombar.deleteItem();
    if (oldIndex >= 0) {
      this.datas.splice(oldIndex, 1);
      if (nindex >= 0) this.sheet.resetData(this.datas[nindex]);
      this.sheet.trigger('change', { eventType: 'deleteSheet' });
    }
  }

  loadData(data) {
    console.log("xxxxxx")
    const ds = Array.isArray(data) ? data : [data];
    if (this.bottombar !== null) {
      this.bottombar.clear();
    }
    this.datas = [];
    if (ds.length > 0) {
      for (let i = 0; i < ds.length; i += 1) {
        const it = ds[i];
        const nd = this.addSheet(it.name, i === 0);
        nd.setData(it);
        if (i === 0) {
          this.sheet.resetData(nd);
        }
      }
    }
    this.addListeners();
    return this;
  }

  loadTabData(data) {
    this.sheet.resetData(data);
  }

  getData() {
    return this.datas.map(it => it.getData());
  }

  cellText(ri, ci, text, sheetIndex = 0) {
    this.datas[sheetIndex].setCellText(ri, ci, text, 'finished');
    return this;
  }

  cell(ri, ci, sheetIndex = 0) {
    return this.datas[sheetIndex].getCell(ri, ci);
  }

  cellStyle(ri, ci, sheetIndex = 0) {
    return this.datas[sheetIndex].getCellStyle(ri, ci);
  }

  reRender() {
    this.sheet.table.render();
    return this;
  }

  on(eventName, func) {
    this.sheet.on(eventName, func);
    return this;
  }

  validate() {
    const { validations } = this.data;
    return validations.errors.size <= 0;
  }

  change(cb) {
    this.sheet.on('change', cb);
    return this;
  }

  static locale(lang, message) {
    locale(lang, message);
  }
}

const spreadsheet = (el, options = {}) => new Spreadsheet(el, options);

if (window) {
  window.x_spreadsheet = spreadsheet;
  window.x_spreadsheet.locale = (lang, message) => locale(lang, message);
}

export default Spreadsheet;
export {
  spreadsheet,
};
