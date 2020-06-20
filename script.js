document.addEventListener("DOMContentLoaded", () => {
  // устанавливаем дефолтное значение для localStorage
  window.localStorage.setItem("sorted", "max");
  const urlData =
    "https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48"; // url с данными
  const coordinatesDME = [55.410307, 37.902451]; // координаты аэропорта домодедово
  const table = document.querySelector(".air-table__body"); // Контейнер с данными
  const sortedTd = document.querySelector("[data-sorted]"); // Элемент с кликом
  const arrayDataNeed = []; // Создаем пустой массив с необходимыми данными
  const sortedMax = (a, b) => a.distance - b.distance; // сортиврока max -> min
  const sortedMin = (a, b) => b.distance - a.distance; // сортировка min -> max
  // Рандомное число в заданном интервале
  const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //Максимум и минимум включаются
  };

  // Шаблон одной строки
  const templateRow = (
    key,
    flightNumber,
    airCoords,
    speed,
    course,
    heightAir,
    codeAirports,
    distance
  ) => {
    return `
        <tr class="air-table__row" data-row-id="row-${key}">
            <td class="air-table__td">${flightNumber}</td>
            <td class="air-table__td">${airCoords}</td>
            <td class="air-table__td">${speed}</td>
            <td class="air-table__td">${course}</td>
            <td class="air-table__td">${heightAir}</td>
            <td class="air-table__td">${codeAirports}</td>
            <td class="air-table__td">${distance}</td>
        </tr>`;
  };
  // Создание необходимого объекта с данными из response
  const createNeedData = (
    flightNumber,
    airCoords,
    speed,
    course,
    heightAir,
    codeAirports,
    distance
  ) => {
    return {
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

  sortedTd.addEventListener("click", (e) => {
    const valueSorted = window.localStorage.sorted;
    if (valueSorted === "max") {
      window.localStorage.sorted = "min";
      arrayDataNeed.sort((a, b) => sortedMin(a, b));
      table.innerHTML = "";
      arrayDataNeed.map((el, key) => {
        return table.insertAdjacentHTML(
          "beforeend",
          templateRow(
            key,
            el.flightNumber,
            el.airCoords,
            el.speed,
            el.course,
            el.heightAir,
            el.codeAirports,
            el.distance
          )
        );
      });
    } else {
      window.localStorage.sorted = "max";
      arrayDataNeed.sort((a, b) => sortedMax(a, b));
      table.innerHTML = "";
      arrayDataNeed.map((el, key) => {
        return table.insertAdjacentHTML(
          "beforeend",
          templateRow(
            key,
            el.flightNumber,
            el.airCoords,
            el.speed,
            el.course,
            el.heightAir,
            el.codeAirports,
            el.distance
          )
        );
      });
    }
  });
  // запрос данных
  fetch(urlData)
    .then((response) => response.json())
    .then((response) => {
      // Убрал все лишние поля из response
      const arrayData = Object.values(response).filter((el) => Array.isArray(el));
      // каждый элемент массива формируем как объект и добавляем в arrayDataNeed
      arrayData.map((el) => {
        arrayDataNeed.push(
          createNeedData(
            el[13],
            `${el[1]}, ${el[2]}`,
            el[5],
            "курс?",
            el[4],
            `${el[11]} - ${el[12]}`,
            Math.round(
              latlng2distance(
                coordinatesDME[0],
                coordinatesDME[1],
                el[1],
                el[2]
              )
            )
          )
        );
      });
      const sortedDataDefault = arrayDataNeed.sort((a, b) => sortedMax(a, b));
      sortedDataDefault.map((el, key) => {
        return table.insertAdjacentHTML(
          "beforeend",
          templateRow(
            key,
            el.flightNumber,
            el.airCoords,
            el.speed,
            el.course,
            el.heightAir,
            el.codeAirports,
            el.distance
          )
        );
      });
      const activeRow = () => {

      }
      const allRows = document.querySelectorAll(".air-table__row");
      const arrAllRows = Array.from(allRows);
      arrAllRows.map((el) => {
        return el.addEventListener("click", (e) => {
          arrAllRows.map(el => {
            return el.style.opacity = 1;
          });
          const clickedRow = e.target.parentNode;
          clickedRow.style.opacity = 0.2;
          window.localStorage.setItem('opacityActive', clickedRow.getAttribute('data-row-id'));
          console.log(window.localStorage.opacityActive);
        });
      });
    });
});
