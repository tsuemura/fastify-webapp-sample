# Fastify-WebApp-Sample

[Fastify](https://www.fastify.io/) を使って作ったWebアプリケーションのサンプルです。
お弁当注文アプリを模して作られています。

## 開発

### 事前準備

`NodeJS` およびパッケージマネージャーの `npm` が必要です。以下のコマンドでバージョンが表示されればインストールされています。インストールされていない場合は [公式サイト](https://nodejs.org/ja/) などからインストールが必要です。

```bash
# NodeJSがインストールされているかどうかを確認。
$ node --version
v14.17.6

# NodeJSのパッケージマネージャー npm がインストールされているかどうかを確認。通常はNodeJSが入っていればnpmも一緒に使えるようになるはずです。
$ npm --version
8.5.3
```

また、バックエンドのデータベースとして [PostgreSQL](https://www.postgresql.org/) を利用しています。これを起動するために [Docker](https://www.docker.com/) のインストールが必要です。詳しいインスール手順については公式の [Get Started](https://www.docker.com/get-started/) を参考にしてください。

```bash
# Docker がインストールされていることを確認。
$ docker --version
Docker version 20.10.11, build dea9396

# docker compose コマンドが利用できることを確認。Dockerをインストールすれば、通常 docker ccompose コマンドも一緒に利用できるようになります。
$ docker compose version
Docker Compose version v2.2.1

# Dockerが起動していることを確認。 hello-world というコンテナをダウンロードして実行する。
$ docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
7050e35b49f5: Pull complete
Digest: sha256:aa0cc8055b82dc2509bed2e19b275c8f463506616377219d9642221ab53cf9fe
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (arm64v8)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/

# hello-worldで、以下のようなメッセージが出た場合はDockerが起動されていません。
$ docker run hello-world
docker: Error response from daemon: dial unix docker.raw.sock: connect: connection refused.
See 'docker run --help'.

```

### 開発用サーバーの起動

最初に、開発に必要なパッケージを一通りインストールします。以下のコマンドでインストールできます。
```bash
$ npm i
```

次に、開発用サーバーを起動します。
```bash
$ npm run dev
```

次のURLからアプリケーションを開けます。
http://127.0.0.1:8080

