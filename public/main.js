let editor;
let checkboxNames = [
  'autoCopy',
  'cleanAllLinebreaks',
  'autoAddLinebreaks',
  'removeSpacesBetweenChinese',
  'addSpaceBetweenChineseAndEnglish',
  'useFullWidthPunctuationMarks'
];
let checkboxes = {};
let setting = {};

document.addEventListener(
  'DOMContentLoaded',
  function() {
    init().then();
  },
  false
);

async function init() {
  editor = document.getElementById('editor');
  loadSetting();
  if (setting === null) {
    setting = {};
  }
  checkboxNames.forEach(key => {
    checkboxes[key] = document.getElementById(key);
    if (key in setting) {
      checkboxes[key].checked = setting[key];
    } else {
      setting[key] = checkboxes[key].checked;
    }
  });
  editor.addEventListener('paste', onPaste);
}

function onPaste(event) {
  let clipboard = event.clipboardData;
  let data = clipboard.getData('text/plain');
  event.preventDefault();
  // remove leading whitespaces
  data = data.replaceAll(/^\s+/g, '');
  // combine concatenated whitespaces
  data = data.replaceAll(/\s+/g, ' ');
  // remove all line breaks
  if (setting['cleanAllLinebreaks']) {
    data = data.replaceAll(/\n+/g, '');
  }
  // remove garbled characters
  data = data.replaceAll(/[]/g, '');
  // deal with word break
  data = data.replaceAll(/-\s/g, '');
  // add linebreaks
  if (setting['autoAddLinebreaks']) {
    data = data.replaceAll(/。\s*/g, '。\n');
    data = data.replaceAll(/\.\s*/g, '.\n');
  }
  // add space between Chinese and English
  if (setting['addSpaceBetweenChineseAndEnglish']) {
    data = addSpaceBetweenChineseAndEnglish(data);
  }
  // remove spaces between Chinese characters
  if (setting['removeSpacesBetweenChinese']) {
    data = removeSpacesBetweenChinese(data);
  }
  // use full-width punctuation marks
  if (setting['useFullWidthPunctuationMarks']) {
    data = useFullWidthPunctuationMarks(data);
  }
  data = fixWrongQuoteForEnglish(data);
  // Decode URL
  data = data.replaceAll(/(www|http:|https:)+([^\s]+)/g, x => {
    return decodeURI(x);
  });
  event.target.value = data;
  if (setting['autoCopy']) {
    copy();
  }
  return false;
}

// https://www.hangge.com/blog/cache/detail_1644.html
// https://www.qqxiuzi.cn/zh/hanzi-unicode-bianma.php
// basic Chinese characters: 20902, 4E00-9FA5
function addSpaceBetweenChineseAndEnglish(str) {
  let p1 = /([A-Za-z_]|[0-9])([\u4e00-\u9fa5]+)/gi;
  let p2 = /([\u4e00-\u9fa5]+)([A-Za-z_]|[0-9])/gi;
  return str.replace(p1, '$1 $2').replace(p2, '$1 $2');
}

function fixWrongQuoteForEnglish(str) {
  let p1 = /([A-Za-z_])(’)/gi;
  let p2 = /([”“])([A-Za-z_])/gi;
  let p3 = /([A-Za-z_])([”“])/gi;
  return str
    .replace(p1, "$1'")
    .replace(p2, '"$2')
    .replace(p3, '$1"');
}

function removeSpacesBetweenChinese(str) {
  let p = /([\u4e00-\u9fa5]+)(\s+)([\u4e00-\u9fa5]+)/gi;
  return str.replace(p, '$1$3');
}

function useFullWidthPunctuationMarks(str) {
  // str = str.replaceAll(/“/g, '「');
  // str = str.replaceAll(/"/g, '」');
  let p = /(")(.+)(")/gi;
  let p2 = /(“)(.+)(”)/gi;
  let p3 = /(\()(.+)(\))/gi;
  // let p4 = /(\[)(.+)(])/gi;
  str = str.replace(p, '「$2」');
  str = str.replace(p2, '「$2」');
  str = str.replace(p3, '（$2）');
  // str = str.replace(p4, '【$2】');
  str = str.replaceAll('.', '。');
  str = str.replaceAll(';', '；');
  str = str.replaceAll('!', '！');
  str = str.replaceAll(',', '，');
  str = str.replaceAll('---', '——');
  str = str.replaceAll(':', '：');
  return str;
}

function addPeriod(str) {
  let lines = str.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i].length;
    if (l <= 1) continue;
    if (lines[i].endsWith('.') || lines[i].endsWith('；')) {
      lines[i][l - 1] = '。';
    } else if (lines[i][l - 1] !== '。') {
      lines[i] += '。';
      console.log(l);
    }
  }
  return lines.join('\n');
}

function loadSetting() {
  setting = localStorage.getItem('setting');
  setting = JSON.parse(setting);
}

function saveSetting() {
  localStorage.setItem('setting', JSON.stringify(setting));
}

function onCheckboxClicked(which) {
  setting[which] = checkboxes[which].checked;
  saveSetting();
}

function copy() {
  editor.select();
  navigator.clipboard.writeText(editor.value).then();
}

function clearInput() {
  editor.value = '';
}
