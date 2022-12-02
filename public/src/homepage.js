

const names=['Trump','Obama','Bush','Biden','Annonymous','Illuminati','Challenger','Iron','Grandmaster',
,'Goinmul','NoobMaster','Newbie','Hacker','Luke','Leia','Anakin','Rey','Finn','Harry',"Obi-Wan",'Hermione','HanSolo','Chewbacca','Windu','Palpatine','Grogu'
,'Ron','Malfoy','Voldemote','Dumbledore','Hagrid','Hedwig','Snape','Gandalf','Saruman','Frodo','Sam','Marry','Pippin','Legolas','Gimli'
,'Bormir','Sauron','Stark','Steve','Peter','Natasha','Clint','Bruce','Gamora','Drax','Groot','Thanos','Thor','Loki','Valkyrie','Wanda','Odin'
,'Yangyi','Gorae','Creed','Silver','Jean','Timo','Jellice','Emiya','Muljomdao',"Faker","Undefined","Null","NAN","/(?![^<>]+>)"]

function golink(link){
  window.location.href=link
}
$("document").ready(async function(){
    try{

      let response=await axios.post('/room/home')
      if(response.data){
        if(response.data.board)$("#postbtn").show()
        if(response.data.simulation) $("#simulation").show()
        if(response.data.marble)$("#marble").show()
      }
    }
    catch(e){
      console.log(e)
      if(e.request.status==307){
        showReconnectBtn()
      }
    }

    

    //checks if user is also maintaing login status in server
    if(localStorage.getItem("username") !=null ){
      let response = await axios.post('/user/current')
    
      if(response.data ===""){
        localStorage.removeItem("username")
        window.location.reload()
        return
      }
    }

  $("#firstpage").show()
  let page = document.location.href.match(/page=([^&]+)/)
  if(page && page[1]==="login"){
  //  delete sessionStorage.username
    if(localStorage.getItem("username")!=null) redirectFromUrlIfPossible()
    else open_login()
  }


  else if(localStorage.getItem("username")!=null){
    setAsLogin(localStorage.getItem("username"))
  }
 
  $("input[name='ip']" ).val(window.location.href.split("://")[1].split("/")[0])
  

  $("#open_create_room").html(chooseLang("Create Room","방 만들기"))
  $("#join").html(chooseLang("Join","방 참가"))

  $("#simulation").html(chooseLang("Simulation","시뮬레이션"))
  $("#reconnect").html(chooseLang("Reconnect","재접속"))

  let loginbtns=$(".loginpage_btn").toArray()
  let registerbtns=$(".regpage_btn").toArray()

  $(loginbtns[0]).html(chooseLang("Login","로그인"))
  $(loginbtns[1]).html(chooseLang("Register","회원가입"))
  $(loginbtns[2]).html(chooseLang("Home","홈으로"))

  $(registerbtns[1]).html(chooseLang("Login","로그인"))
  $(registerbtns[0]).html(chooseLang("Register","회원가입"))
  $(registerbtns[2]).html(chooseLang("Home","홈으로"))

  $("#langbtn").click(function(){
      $(".lang_dropdown").toggle()
  })

  $(".dropitem").click(function(){
    $(".lang_dropdown").hide()
    let lang=$(this).attr("value")
    sessionStorage.language=lang
    window.location.reload()
  })
  $("#quitbtn").click(function(){
    try{
      android.quit()
    }
    catch(e){}
  })

  window.onbeforeunload = function (e) {
    
  }
  $("#postbtn").click(()=>window.location.href="/board")
})


// $("#logout").click(function(){
//   try{
//     android.quit()
//   }
//   catch(e){}
// })

// $("#selectsignin").click(function(){
//   var loginpage=$("#signin")
//   if($(loginpage).css("display")==="none"){
//     $("#signin").fadeIn(700)
//   }
//   else{
//     $("#signin").hide()
//   }
// })
// $("#selectsignup").click(function(){
//   window.location.href="file:///android_asset/html/signup.html"
// })

function showReconnectBtn(){
  $("#join").hide()
  // $("input").hide()
  $("#simulation").hide()
  $("#open_create_room").hide()
  $("#reconnect").show()
}
function chooseLang(eng,kor){
  return sessionStorage.language==="kor"?kor:eng
}

function mypage(){
  window.location.href="/user/"
}
$("#loginform").submit(function(e){
  e.preventDefault()


  let username = $( this ).find( "input[name='username']" ).val()
  let password = $( this ).find( "input[name='password']" ).val()
  if(username==="" || password===""){
    alert("Empty")
    return
  }
  $(".input_alert").html("")

  axios.post('/user/login',{username:username,password:password})
  .then(function(res){
        let status = res.status;  
        if(res.data==='username'){
          $(".input_alert.login_id").html(chooseLang("Username does not exist","존재하지 않는 아이디입니다"))
        }
        else if(res.data==="password"){
          $(".input_alert.login_pw").html(chooseLang("Password does not match","비밀번호 미일치"))
        }
        else if(status===200){
          let redirect = document.location.href.match(/redirect=([^&]+)/)
          setAsLogin(username)
          if(redirect){
            window.location.href=redirect[1]
          }          
       //  alert("Logged in")
        }
      })
      .catch(function(e){
        alert("server error"+e)
      })
})



$("#registerform").submit(function(e){
  e.preventDefault()

  $(".input_alert").html("")
  let username = $( this ).find( "input[name='username']" ).val()
  let password = $( this ).find( "input[name='password']" ).val()
  let password2 = $( this ).find( "input[name='password2']" ).val()
  let email = $( this ).find( "input[name='email']" ).val()
  if(username==="" || password===""|| password2===""|| email===""){
    alert("Empty")
    return
  }
  if(password!==password2){
    $(".input_alert.register_pw").html(chooseLang("Password not match","비밀번호가 다릅니다"))
    return
  }
  if(email.match(/[^@]+@[^.]+\.[a-z]+/)==null){
    $(".input_alert.register_email").html(chooseLang("Not a valid email","유효한 이메일을 입력하세요"))
    return
  } 


  let data={username:username,password:password,email:email}
  

  $.ajax({
        method: 'POST',
        url: '/user/register',
        data: data,
      })
  .done(function(res, statusText, xhr){
        let status = xhr.status;   
        console.log(res)
        console.log(statusText)
        console.log(xhr)
       
        if(status===200){
          alert("Registered")
          window.location.href="index.html?page=login"
        }
      })
      .fail(function(res, statusText, xhr){
        console.log(res)
        console.log(res.responseText)
        console.log(xhr.status)

        let status = res.status;
        if(status===400){
          if(res.responseText==='username'){
            $(".input_alert.register_id").html(chooseLang("Username should be between 2~15 characters","아이디는 2~15글자 사이여야 합니다"))
          }
          else if(res.responseText==="password"){
            $(".input_alert.register_pw").html(chooseLang("Password should be longer than 3 characters containing both alphabet and number"
            ,"비밀번호는 숫자와 영문포함 3글자 이상이어야 합니다 "))
          }
          else if(res.responseText==="duplicate username"){
            $(".input_alert.register_id").html(chooseLang("Username duplicate","아이디 중복"))
          }
        }
        else{
          alert("server error, status:"+status)
        }
        
        
      })
})

function setAsLogin(username){
  redirectFromUrlIfPossible()
  localStorage.setItem("username",username)
  
  $(".page").hide()

  $("#firstpage").show()
  $("#input-username").hide()
  $(".input_alert").html("")
  $("#loginbtn").hide()
  $("#mypagebtn").show()
  $("input[name='nickname']" ).val(username)
  $("#logged_in_username p").html("Welcome, <b id='myname'>"+username+"</b>")
  
}


function redirectFromUrlIfPossible(){
  let redirect = document.location.href.match(/redirect=([^&]+)/)
  console.log(redirect)
  if(redirect){
    window.location.href=redirect[1]
  }
}

function logout(){
  localStorage.removeItem("username")
  $.ajax({
        method: 'POST',
        url: '/user/logout'
      }).done(()=>{
        alert("Logged out")
        window.location.reload()
    })

     // alert("Logged out")
  // $("#loginbtn").show()
  // $("#logoutbtn").hide()
  // $("input[name='nickname']" ).val("")
}
function open_firstpage(){
  window.location.href="index.html"
}
function open_login(){
  $(".page").hide()

  $("#loginpage").show()

}
function open_signup(){
  $(".page").hide()

  $("#signuppage").show()
  
}
function open_createroom(){
  $("#field").show()
  $("#buttons").hide()
  // $("#simulation").hide()
  $("#lowbtns").hide()
  $("#ip_area").hide()
//  $("#input-username").hide()
}
function close_createroom(){
  $("#field").hide()
  $("#buttons").show()
  // $("#simulation").show()
  $("#lowbtns").show()
  // $("#input-username").show()

  // $("#ip_area").show()

}
function createroom(isMarble){


  console.log("create room")
  let roomName=$("input[name='room_name']" ).val()


  // if(!r || r===""){
  //   r="room_"+String(Math.floor(Math.random()*1000000))
  // }
  // sessionStorage.roomName=r
  if(!roomName){
    roomName=""
  }
 
  let n=$("input[name='nickname']" ).val()
  if(!n || n===""){
    let l=names.length-1
    n=names[Math.floor(Math.random()*l)]
    n+=String(Math.floor(Math.random()*10))
  }
  
  sessionStorage.ip_address=$("input[name='ip']" ).val()
  sessionStorage.nickName=n
  // sessionStorage.turn=0
  // sessionStorage.host="true"
  // window.location.href="matching.html"

  $.ajax({
        method: 'POST',
        url: (isMarble?'/room/create_marble':'/room/create_rpg'),
        data: {roomname:roomName,username:n},
    })
    .done(function(data, statusText, xhr){
      let status = xhr.status;
      console.log(status)

      if(status==201){
        window.location.href="matching.html?gametype="+(isMarble?"marble":"rpg")
      }
      if(status==307){
        window.location.href="gamepage.html"
      }
    })
    .fail(function(data, statusText, xhr){
      if(data.status==400){
        alert("That room name already exist")
      }
    })
}

function toStatpage(){
  sessionStorage.ip_address=$("input[name='ip']" ).val()

  window.location.href="statpage.html"
}
// function changelang(){
//   if(sessionStorage.language==="eng"){
//     sessionStorage.language="kor"
//     alert("Changed to Korean")
//     // $("#changelang").html("Change to English")
//   }
//   else{
//     sessionStorage.language="eng"
//     alert("Changed to English")
//     // $("#changelang").html("Change to Korean")
//   }

// }

function tolocalhost(){
  $("input[name='ip']" ).val("127.0.0.1:4000")
}


function join(){
  let n=$("input[name='nickname']" ).val()
  if(!n || n===""){
    let l=names.length
    n=names[Math.floor(Math.random()*l)]
    n+=String(Math.floor(Math.random()*10))
  }

  sessionStorage.nickName=n
  let url=$("input[name='ip']" ).val()
  sessionStorage.ip_address=url

  $.ajax({
        method: 'POST',
        url: '/room/join',
        data: {username:n},
    })
    .done(function(data, statusText, xhr){
      let status = xhr.status;
      console.log(status)
      if(status==200){
        window.location.href="matching.html"
      }
      if(status==307){
        window.location.href="gamepage.html"
      }
    })
    .fail(function(data, statusText, xhr){
      
        console.error("error")
      
    })
}
function simulation(){
  let r="simulation_"+String(Math.floor(Math.random()*1000000))
  
  sessionStorage.ip_address=$("input[name='ip']" ).val()

  window.location.href="simulation_selection_page.html"

}
function toGamepage(){
  window.location.href="gamepage.html"
}