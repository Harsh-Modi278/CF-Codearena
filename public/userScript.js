const user_html= document.getElementById('user');
const form= document.querySelector('form');

async function get_user(user)
{
    const base_url=`https://codeforces.com/api/user.status?handle=`;
    const response = await fetch(base_url+user);
    if(!response.ok)
    {
        alert("PLEASE ENTER PROPER USER HANDLE");
        return;
    }
    let data = await response.json();
    data = data.result;
    return user;
}

function user_input(event)
{
    get_user(user_html.value)
        .then((user)=>{
            const url="/"+roomName+"/user";
            if(!user)
            {
                fetch(url,{
                    method: "POST",
                    body: JSON.stringify({user: user, isuser:false})
                })
                .then(response => response.json())
                .then(data => window.location.href = data.redirect)
                .catch(err => console.log(err));
            }
            else
            {
                fetch(url,{
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({user: user, isuser:true})
                })
                .then(response => response.json())
                .then(data => window.location.href = data.redirect)
                .catch(err => console.log(err));
            }
                
        })
        .catch(err=> console.log(err))
    event.preventDefault();
}
form.addEventListener("submit",user_input);