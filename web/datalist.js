class DataList {
  constructor(containerId, inputId, listId, options) {
    this.containerId = containerId;
    this.inputId = inputId;
    this.listId = listId;
    this.options = options;
    this.filterResults = [];
  }

  //allgemeine datenliste erstellen bzw. mit filter
  create(filter = '') {
    const list = document.getElementsByClassName(this.listId)[0];

    // filter daten nach dem input
    this.filterResults = this.options.filter((ele) => {
      const country = ele.country.toLocaleLowerCase();
      filter = filter.toLocaleLowerCase();
      return filter === '' || country.includes(filter);
    });

    // liste anzeigen oder nicht
    if (this.filterResults.length === 0 || filter.length === 0) {
      container.classList.remove('active');
    } else {
      container.classList.add('active');
    }

    // results werden in die ul hinzugefügt
    list.innerHTML = this.filterResults
      .map((option) => `<li value=${option.value}>${option.country}</li>`)
      .join('');
  }

  // events werden angebunden
  addListeners(datalist) {
    // get elements
    const container = document.getElementsByClassName(this.containerId)[0];
    const input = document.getElementsByClassName(this.inputId)[0];
    const list = document.getElementsByClassName(this.listId)[0];
    const clearButton = document.getElementsByClassName('btn')[0];

    // liste wird angezeigt sobald der input angeklickt wird bzw. bei fehleingaben wird die ganze liste angezeigt
    input.addEventListener('click', (e) => {
      if (
        e.target.className === this.inputId &&
        this.filterResults.length > 0
      ) {
        container.classList.toggle('active');
      } else if (e.target.className === this.inputId) {
        this.create();
        container.classList.toggle('active');
      }
    });

    // reagiert auf inputs
    input.addEventListener('input', function (e) {
      if (!container.classList.contains('active')) {
        container.classList.add('active');
      }

      datalist.create(input.value);
    });

    // listen elemente werden als value eingesetzt
    list.addEventListener('click', function (e) {
      if (e.target.nodeName.toLocaleLowerCase() === 'li') {
        input.value = e.target.innerText;
        input.setAttribute('value', e.target.getAttribute('value'));
        container.classList.remove('active');
        clearButton.style.display = 'block';
      }
    });
  }
}

// datenliste wird geholt
const getData = async () => {
  return await fetch('./countries.json')
    .then((res) => res.text())
    .then((jsonString) => JSON.parse(jsonString));
};

getData().then((res) => {
  const datalist = new DataList(
    'search-container',
    'search',
    'datalist',
    res.countriesWithISOCode
  );
  datalist.create();
  datalist.addListeners(datalist);
});
