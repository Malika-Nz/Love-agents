document.addEventListener("click", (e) => {
  if (e.target.dataset.type === "userButton") {
    const id = e.target.dataset.id;
    const data = new FormData();
    data.append("id", id);

    let url = "";
    if (e.target.innerText === "Архивировать") {
      url = "http://localhost:3333/archivate";
    } else {
      url = "http://localhost:3333/unarchivate";
    }

    fetch(url, {
      method: "POST",
      body: data,
    })
      .then((res) => {
        if (res.ok) {
          window.location.reload();
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          alert(data.error);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Ошибка запроса");
      });
  }

  if (e.target.dataset.type === "letterButton") {
    const id = e.target.dataset.id;
    const data = new FormData();
    data.append("id", id);

    let status = "";
    if (e.target.innerText === "Принять") {
      status = "A";
    } else {
      status = "D";
    }

    data.append("status", status);

    fetch("/update_letter", {
      method: "POST",
      body: data,
    })
      .then((res) => {
        if (res.ok) {
          window.location.reload();
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          alert(data.error);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Ошибка запроса");
      });
  }

  if (e.target.dataset.type === "report") {
    const id = e.target.dataset.id;

    let url = new URL("http://localhost:3333/report_letter");
    url.searchParams.append("id", id);

    window.open(url);
  }
});
