const inviteForm = document.getElementById('inviteForm');

inviteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const active_item = document.querySelector('.active');
    const recipientId = active_item.getAttribute('id');
   
    const data = new FormData(inviteForm);
    data.append('recipient', recipientId);
    
    fetch('http://localhost:3333/invite', {
        method: 'POST',
        body: data
    }).then(res => {
        if (res.ok) {
            alert('Приглашение отправлено!');
            window.location.reload();
            return;
        }
        return res.json();
    }).then(data => {
        if (data) {
            alert(data.error);
        }
    }).catch(err => {
        console.error(err);
        alert('Ошибка запроса');
    })
});