document.addEventListener("DOMContentLoaded", () => {
  const urlData =
    "https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48"; // url с данными
  const DME = [55.410307, 37.902451];
  const KNOT = 1.852;
  const FOOT = 3.281;
  let isSortValue = true; // сортировка таблицы
  const container = document.querySelector(".air-table__body");
  const columnSorted = document.querySelector("[data-sorted]");
  const sortedData = (data, isMaxSorted = true) => {
    return data.sort((a, b) => (isMaxSorted ? a[8] - b[8] : b[8] - a[8]));
  };
  const drawTable = (data) => {
    container.innerHTML = "";
    data.map((el) => {
      return (container.innerHTML += createRow(
        el[0],
        el[1],
        `${el[2]} - ${el[3]}`,
        el[4],
        "?",
        el[5],
        `${el[6]} - ${el[7]}`,
        el[8]
      ));
    });
    // после отрисовки таблицы у нас все все строки
    const rows = Array.from(document.querySelectorAll(".air-table__row"));
    rows.map((row) => {
      row.addEventListener("click", function () {
        const isContainsClass = this.classList.contains("bg-primary");
        const saveRowsStorage = window.localStorage.getItem("saveRow");
        // если у строки есть активный клаа
        if (isContainsClass) {
          this.classList.remove("bg-primary"); // удалим этот активный класс
          const newSaveRowsStorage = saveRowsStorage // в любом случае localStorage тут НЕ пустой
            .split(", ") // сделаем из строки массив
            .filter((el) => el !== this.getAttribute("data-id")) // отфильтруем этот массив по id
            .join(", "); // вернем обратно строку
          window.localStorage.setItem("saveRow", newSaveRowsStorage); // обновим localStorage
        } else {
          // если у строки нет класса, тогда проверяем localStorage
          if (saveRowsStorage === null) {
            // если пусто задаем значение
            window.localStorage.setItem(
              "saveRow",
              this.getAttribute("data-id")
            );
          } else {
            // если в localStorage уже что-то написано, то объединяем эти значения
            window.localStorage.setItem(
              "saveRow",
              `${saveRowsStorage}, ${this.getAttribute("data-id")}`
            );
          }
          this.classList.add("bg-primary");
        }
      });
    });
  };
  const createRow = (
    id,
    flightNumber,
    airCoords,
    speed,
    course,
    heightAir,
    codeAirports,
    distance
  ) => {
    const baseTemplate = `<tr class="air-table__row" data-id="${id}">
        <td class="air-table__td">${flightNumber}</td>
        <td class="air-table__td">${airCoords}</td>
        <td class="air-table__td">${speed}</td>
        <td class="air-table__td">${course}</td>
        <td class="air-table__td">${heightAir}</td>
        <td class="air-table__td">${codeAirports}</td>
        <td class="air-table__td">${distance}</td>
        </tr>`;
    const activeTemplate = `<tr class="air-table__row bg-primary" data-id="${id}">
        <td class="air-table__td">${flightNumber}</td>
        <td class="air-table__td">${airCoords}</td>
        <td class="air-table__td">${speed}</td>
        <td class="air-table__td">${course}</td>
        <td class="air-table__td">${heightAir}</td>
        <td class="air-table__td">${codeAirports}</td>
        <td class="air-table__td">${distance}</td>
        </tr>`;
    const activeRows =
      window.localStorage.getItem("saveRow") === null
        ? null
        : window.localStorage.getItem("saveRow").split(", ");
    if (!!activeRows) {
      return activeRows.includes(id) ? activeTemplate : baseTemplate;
    }
    return baseTemplate;
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
    // расстояние между двумя координатами в метрах
    return Math.round(ad * R);
  };
  const formattingData = (dataFromResponse) => {
    return Object.keys(dataFromResponse)
      .reduce((acc, current) => {
        return [...acc, [current, ...dataFromResponse[current]]];
      }, [])
      .reduce((acc, current) => {
        const [
          id,
          ,
          coords1,
          coords2,
          ,
          heightInFoots,
          speedInKnots,
          ,
          ,
          ,
          ,
          ,
          airportFrom,
          airportTo,
          flightNumber,
        ] = current;
        return [
          ...acc,
          [
            id,
            flightNumber,
            coords1,
            coords2,
            Math.round(speedInKnots * KNOT),
            Math.round(heightInFoots / FOOT),
            airportFrom,
            airportTo,
            latlng2distance(DME[0], DME[1], coords1, coords2),
          ],
        ];
      }, []);
  };

  fetch(urlData)
    .then((response) => {
      return response.ok ? response.json() : response.status;
    })
    .then((data) => {
      const { full_count, version, ...rest } = data;
      const allAirplanes = formattingData(rest);
      /*Сортировка массива в порядке возрастания от DME по умолчанию*/
      sortedData(allAirplanes);
      drawTable(allAirplanes);
      columnSorted.addEventListener("click", function (e) {
        e.preventDefault();
        if (this.getAttribute("data-sorted") === "max") {
          isSortValue = false;
          this.setAttribute("data-sorted", "min");
        } else {
          isSortValue = true;
          this.setAttribute("data-sorted", "max");
        }
        sortedData(allAirplanes, isSortValue);
        drawTable(allAirplanes);
      });
      const timerId = setInterval(() => {
        fetch(urlData)
          .then((response) => {
              if (!response.ok) {
                  clearInterval(timerId);
                  throw new Error('Ответ сети был не ok.');
              }
              return response.json();
          })
          .then((data) => {
            const { full_count, version, ...rest } = data;
            const allAirplanes = formattingData(rest);
            sortedData(allAirplanes, isSortValue);
            drawTable(allAirplanes);
          })
          .catch((error) => {
              console.log(error.message);
              clearInterval(timerId);
          });
      }, 4000);
    })
    .catch((error) => {
      console.log(error.message);
      throw new Error('Ответ сети был не ok.');
    });
});
