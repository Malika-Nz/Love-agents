const inviteForm = document.getElementById("inviteForm");

inviteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const active_item = document.querySelector(".active");
  const recipientId = active_item.getAttribute("id");

  const data = new FormData(inviteForm);
  data.append("recipient", recipientId);

  fetch("http://localhost:3333/invite", {
    method: "POST",
    body: data,
  })
    .then((res) => {
      if (res.ok) {
        alert("Приглашение отправлено!");
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
});

const filterForm = document.getElementById("filterForm");

filterForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = new FormData(filterForm);

  window.location.href =
    "cards?" +
    new URLSearchParams({
      fio: data.get("fio"),
      start_age: data.get("start_age"),
      end_age: data.get("end_age"),
      city: data.get("city"),
    });
});

filterForm.addEventListener("reset", async (e) => {
  e.preventDefault();

  window.location.href = "cards";
});
