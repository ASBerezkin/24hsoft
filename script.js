document.addEventListener("DOMContentLoaded", () => {
  // устанавливаем дефолтное значение для сортировки в localStorage
  let sortedStorage =
    window.localStorage.getItem("sorted") === null
      ? window.localStorage.setItem("sorted", "max")
      : window.localStorage.getItem("sorted");
  // устанавливаем дефолтное значение для строки с opacity в localStorage
  let showStorage =
    window.localStorage.getItem("show") === null
      ? window.localStorage.setItem("show", "-1")
      : window.localStorage.getItem("show");
  let full_count = 0; // переменная по которой будем изменять данные в таблице
  const urlData =
    "https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48"; // url с данными
  const coordinatesDME = [55.410307, 37.902451]; // координаты аэропорта домодедово
  const tableBody = document.querySelector(".air-table__body"); // Контейнер с данными
  const sortedTd = document.querySelector("[data-sorted]"); // Элемент с кликом
  let GLOBAL_DATA;
  const sortedMax = (a, b) => a.distance - b.distance; // сортиврока max -> min
  const sortedMin = (a, b) => b.distance - a.distance; // сортировка min -> max
  // Создание необходимого объекта с данными из response
  const createAirplain = (
    id,
    show,
    flightNumber,
    airCoords,
    speed,
    course,
    heightAir,
    codeAirports,
    distance
  ) => {
    return {
      id: id,
      show: show,
      flightNumber: `${flightNumber}`,
      airCoords: `${airCoords}`,
      speed: Number(speed),
      course: `${course}`,
      heightAir: Number(heightAir),
      codeAirports: `${codeAirports}`,
      distance: Number(distance),
    };
  };
  // подсчет расстояния от домодедово до самолета в метрах
  const latlng2distance = (lat1, long1, lat2, long2) => {
    //радиус Земли
    const R = 6372795;
    //перевод коордитат в радианы
    lat1 *= Math.PI / 180;
    lat2 *= Math.PI / 180;
    long1 *= Math.PI / 180;
    long2 *= Math.PI / 180;
    //вычисление косинусов и синусов широт и разницы долгот
    const cl1 = Math.cos(lat1);
    const cl2 = Math.cos(lat2);
    const sl1 = Math.sin(lat1);
    const sl2 = Math.sin(lat2);
    const delta = long2 - long1;
    const cdelta = Math.cos(delta);
    const sdelta = Math.sin(delta);
    //вычисления длины большого круга
    const y = Math.sqrt(
      Math.pow(cl2 * sdelta, 2) + Math.pow(cl1 * sl2 - sl1 * cl2 * cdelta, 2)
    );
    const x = sl1 * sl2 + cl1 * cl2 * cdelta;
    const ad = Math.atan2(y, x);
    const distance = ad * R; //расстояние между двумя координатами в метрах
    return distance;
  };
  // создание 1 строки
  const createRow = (
    id,
    show,
    flightNumber,
    airCoords,
    speed,
    course,
    heightAir,
    codeAirports,
    distance
  ) => {
    return show
      ? `<tr class="air-table__row air-table__opacity" data-row-id="${id}">
        <td class="air-table__td">${flightNumber}</td>
        <td class="air-table__td">${airCoords}</td>
        <td class="air-table__td">${speed}</td>
        <td class="air-table__td">${course}</td>
        <td class="air-table__td">${heightAir}</td>
        <td class="air-table__td">${codeAirports}</td>
        <td class="air-table__td">${distance}</td>
        </tr>`
      : `<tr class="air-table__row" data-row-id="${id}">
        <td class="air-table__td">${flightNumber}</td>
        <td class="air-table__td">${airCoords}</td>
        <td class="air-table__td">${speed}</td>
        <td class="air-table__td">${course}</td>
        <td class="air-table__td">${heightAir}</td>
        <td class="air-table__td">${codeAirports}</td>
        <td class="air-table__td">${distance}</td>
        </tr>`;
  };

  // заполнение таблицы данными
  const fillTable = (data) => {
    full_count = data.full_count;
    // достал все значения и проверил, являются ли каждый из них массивом
    const allAirplains = Object.values(data).filter((el) => Array.isArray(el));
    // переменная для всех самолетов
    const allAirplainsData = [{ sorted: sortedStorage, airplains: [] }];
    // добавление всех самолетов в переменную
    allAirplainsData[0].airplains.push(
      ...allAirplains.map((el) => {
        return createAirplain(
          el[13],
          el[13] === showStorage,
          el[13],
          `${el[1]}, ${el[2]}`,
          el[5],
          "курс?",
          el[4],
          `${el[11]} - ${el[12]}`,
          Math.round(
            latlng2distance(coordinatesDME[0], coordinatesDME[1], el[1], el[2])
          )
        );
      })
    );
    // отсортировали данные в зависимости от localstorage.sorted
    allAirplainsData[0].airplains.sort((a, b) =>
      sortedStorage === "max" ? sortedMax(a, b) : sortedMin(a, b)
    );
    // создал переменную для всех строк
    const allRowsHTML = allAirplainsData[0].airplains.map(
      ({
        show,
        flightNumber,
        airCoords,
        speed,
        course,
        heightAir,
        codeAirports,
        distance,
      }) => {
        return createRow(
          flightNumber,
          show,
          flightNumber,
          airCoords,
          speed,
          course,
          heightAir,
          codeAirports,
          distance
        );
      }
    );
    // добавил все самолеты в таблицу
    tableBody.insertAdjacentHTML("afterbegin", allRowsHTML.join(""));
    //
    const allRows = document.querySelectorAll(".air-table__row");
    const arrAllRows = Array.from(allRows);
    arrAllRows.map((el) => {
      return el.addEventListener("click", (e) => {
        arrAllRows.map((el) => {
          return el.classList.remove("air-table__opacity");
        });
        const clickedRow = e.target.parentNode;
        clickedRow.classList.add("air-table__opacity");
        window.localStorage.setItem(
          "show",
          clickedRow.getAttribute("data-row-id")
        );
        showStorage = window.localStorage.getItem("show");
      });
    });
    // Part 1 END
  };
  // первая загрузка
  fetch(urlData)
    .then((response) => response.json())
    .then((data) => {
      GLOBAL_DATA = data;
      fillTable(GLOBAL_DATA);
    });
  // последующие загрузки данных
  const timer = setInterval(() => {
    fetch(urlData)
      .then((response) => response.json())
      .then((data) => {
        if (full_count !== data.full_count) {
          tableBody.innerHTML = "";
          GLOBAL_DATA = data;
          fillTable(GLOBAL_DATA);
        } else return;
      });
  }, 4000);

  sortedTd.addEventListener("click", () => {
    if (sortedStorage === "max") {
      window.localStorage.sorted = "min";
      sortedStorage = window.localStorage.getItem("sorted");
      tableBody.innerHTML = "";
      fillTable(GLOBAL_DATA);
    } else {
      window.localStorage.sorted = "max";
      sortedStorage = window.localStorage.getItem("sorted");
      tableBody.innerHTML = "";
      fillTable(GLOBAL_DATA);
    }
  });
});
