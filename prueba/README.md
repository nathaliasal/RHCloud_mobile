# Pruebas de WebSocket de Notificaciones

Esta carpeta contiene ejemplos listos para integrar el canal WebSocket de notificaciones en:

- React Web
- React Native

## Requisitos previos

1. Backend desplegado con endpoint WebSocket activo en `/api/v1/notifications/ws`.
2. Access token JWT valido.
3. El usuario del token debe ser el destinatario de las notificaciones.

## 1) React Web

Archivo: `react-web-useNotificationsSocket.js`

Uso rapido:

```jsx
import React from "react";
import { useNotificationsSocketWeb } from "./react-web-useNotificationsSocket";

export default function Demo() {
  const [events, setEvents] = React.useState([]);

  useNotificationsSocketWeb({
    wsBaseUrl: "wss://dev.stalch.com",// Poner varibles de entorno 
    getAccessToken: () => localStorage.getItem("access_token"),
    refreshAccessToken: async () => {
      // Aqui llamas tu endpoint de refresh y guardas el nuevo access token.
      // Debe retornar el nuevo access token como string.
      return localStorage.getItem("access_token");
    },
    onNotification: (event) => {
      setEvents((prev) => [event, ...prev]);
    },
  });

  return (
    <div>
      <h3>Eventos de notificacion</h3>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  );
}
```

## 2) React Native

Archivo: `react-native-useNotificationsSocket.js`

Uso rapido:

```jsx
import React from "react";
import { View, Text } from "react-native";
import { useNotificationsSocketNative } from "./react-native-useNotificationsSocket";

export default function DemoScreen() {
  const [events, setEvents] = React.useState([]);

  useNotificationsSocketNative({
    wsBaseUrl: "wss://dev.stalch.com", // Poner varibles de entorno 
    getAccessToken: async () => {
      // Ejemplo: leer desde AsyncStorage
      // return await AsyncStorage.getItem("access_token");
      return "TU_ACCESS_TOKEN";
    },
    refreshAccessToken: async () => {
      // Llama tu endpoint de refresh y retorna access token nuevo
      return "TU_ACCESS_TOKEN_NUEVO";
    },
    onNotification: (event) => {
      setEvents((prev) => [event, ...prev]);
    },
  });

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
        Eventos de notificacion
      </Text>
      <Text>{JSON.stringify(events, null, 2)}</Text>
    </View>
  );
}
```

## Eventos que emite tu backend

- `ping`: debes responder con `pong`.
- `notification.created`: notificacion nueva.
- `notification.updated`: notificacion actualizada.

## Manejo de expiracion del token

Tu backend puede cerrar el socket con codigo `1008` cuando el token expira.
Estos hooks intentan:

1. refrescar token,
2. reconectar automaticamente,
3. aplicar backoff progresivo para evitar reconexiones agresivas.

## Nota de seguridad

No hardcodees tokens en codigo productivo. Usa storage seguro y refresh token flow.
