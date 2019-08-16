import { Component, OnInit } from '@angular/core';
import {Client} from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private client: Client;

  constructor() { }

  ngOnInit() {
    this.client = new Client();
    /* asignar SockJK al stomp */
    this.client.webSocketFactory = () => {
      return new SockJS("http://localhost:8080/chat-websocket"); // endpoint para conectar
    }
    /* escuchar cuando con conectamos/desconectamos
    * el objeto "frame" contiene toda la informacionde nuestra conecxion con el broker */
    this.client.onConnect = (frame) => {
      console.log('Conectados: ' + this.client.connected + ' : ' + frame);
    }
    /* conexion */
    this.client.activate();
  }

}
