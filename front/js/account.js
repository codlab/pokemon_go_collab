$(function(){

  var UUID_KEY = constants.store.UUID_KEY;
  var PASS_KEY = constants.store.PASS_KEY;
  var TOKEN_KEY = constants.store.TOKEN_KEY;

  function updateAccountMenu(){
    var uuid = store.get(UUID_KEY);
    var token = store.get(TOKEN_KEY);

    if(uuid && uuid.length > 0 && token && token.length > 0) {
      $("#no-account").addClass("hide");
      $("#register").addClass("hide");
      $("#login").addClass("hide");
      $("#disconnect").removeClass("hide");
    }else{
      $("#no-account").removeClass("hide");
      $("#register").removeClass("hide");
      $("#login").removeClass("hide");
      $("#disconnect").addClass("hide");
    }
  }
  $("#register_end_modal").leanModal({
    dismissible: false
  });

  $("#login").on("click", function() {
    $("#login_modal").click();

    var uuid = store.get(UUID_KEY);
    var priv = store.get(PASS_KEY);
    $("#login_uuid").val(uuid);
    $("#login_priv").val(priv);
    $("#login_uuid").addClass("active");
    $("#login_priv").addClass("active");
  });

  $("#register").on("click", function() {
    $("#register_modal").click();
  });

  $("#register_validate").on("click", function() {
    $.post("/api/user/register", function( data ) {
      if(data.user_uuid) {
        $("#register_info").html("User Id / Login: "+data.user_uuid);
        $("#register_priv").html("Password: "+data.user_priv);

        store.set(UUID_KEY, data.user_uuid);
        store.set(PASS_KEY, data.user_priv);
        store.set(TOKEN_KEY, data.user_priv);
        $("#register_modal_element").closeModal();
        $("#register_end_modal").click();
        updateAccountMenu();
      }
      console.log(data);
    });
  })

  $("#register_cancel").on("click", function() {
    $("#register_modal_element").closeModal();
  });

  $("#login_cancel").on("click", function() {
    $("#login_modal_element").closeModal();
  });

  $("#disconnect").on("click", function() {
    store.set(TOKEN_KEY, "");

    updateAccountMenu();
  });

  $("#login_validate").on("click", function() {
    var uuid = $("#login_uuid").val();
    var token = $("#login_priv").val();

    if(uuid && uuid.length > 0 && token && token.length > 0) {
      $.ajax({
        url : "/api/user/login",
        type: "POST",
        data: JSON.stringify({
          uuid: uuid,
          token: token
        }),
        contentType: "application/json; charset=utf-8",
        dataType   : "json",
        success    : function(data){
          if(data){
            store.set(UUID_KEY, data.user_uuid);
            store.set(PASS_KEY, data.user_priv);
            store.set(TOKEN_KEY, data.user_priv);
          }
          
          $("#login_modal_element").closeModal();

          updateAccountMenu();
        }
      });
    }
  });

  updateAccountMenu();
});
