import { Component, OnInit } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Mensaje } from './models/mensaje';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;

  conectado: boolean = false;
  mensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];
  escribiendo: string;

  constructor() { }

  ngOnInit() {
    this.client = new Client();
    /* asignar SockJK al stomp */
    this.client.webSocketFactory = () => {
      return new SockJS("http://localhost:8080/chat-websocket"); // endpoint para conectar
    }

    /* escuchar cuando con conectamos
      el objeto "frame" contiene toda la informacionde nuestra conecxion con el broker */
    this.client.onConnect = (frame) => {
      console.log('Conectados: ' + this.client.connected + ' : ' + frame);
      this.conectado = true;

      /* Nos subscribimos a "/chat/mensaje" para escuchar los mensajes que llegan 
        el broker lo recibe y luego lo emite a todos los que estan subscritos a este evento */
      this.client.subscribe('/chat/mensaje', e => {
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        // fecha
        mensaje.fecha = new Date(mensaje.fecha);
        // color del userbname
        if (!this.mensaje.color && mensaje.tipo == 'NUEVO_USUARIO' && this.mensaje.username == mensaje.username) {
          this.mensaje.color = mensaje.color;
        }

        this.mensajes.push(mensaje);
        console.log(mensaje);
      });

      /* informo a todos los que estan subscribidos que el usuario esta escribiendo */
      this.client.subscribe('/chat/escribiendo', e => {
        this.escribiendo = e.body;
        setTimeout(() => {this.escribiendo = '';}, 3000);
      });

      /* enviamos el username al websocket */
      this.mensaje.tipo = 'NUEVO_USUARIO';
      this.client.publish({ destination: '/app/mensaje', body: JSON.stringify(this.mensaje) });

    }

    /* escuchar cuando con desconectamos
    * el objeto "frame" contiene toda la informacionde nuestra conecxion con el broker */
    this.client.onDisconnect = (frame) => {
      console.log('Desconectados: ' + !this.client.connected + ' : ' + frame);
      this.conectado = false;
    }
  }

  /* conexion del chat */
  conectar(): void {
    this.client.activate();
  }

  /* des-conexion del chat */
  desconectar(): void {
    this.client.deactivate();
  }

  /* destination: va el metodo del controlador del broker
    body: el objeto mensaje que contiene el texto convertido a string */
  enviarMensaje(): void {
    this.mensaje.tipo = 'MENSAJE';
    this.client.publish({ destination: '/app/mensaje', body: JSON.stringify(this.mensaje) });
    this.mensaje.texto = '';
  }

  /* envia con publish el "username" que esta escribiendo al broker */
  escribiendoEvento(): void {
    this.client.publish({ destination: '/app/escribiendo', body: this.mensaje.username });
  }

}
