This directory contains a simple irc app which is a work in progress.

/app - contains the manifest and any additional resources which are to be
    packaged in a crx.

/servlet - contains the java servlet which will serve the live resources and
    also proxy the irc traffic between the client and irc servers

/conf - contains configuration files for running the servlet.

This example depends on WebSockets, so it must be run inside a servlet container
which supports WebSockets.

The following are instructions for setting up a development jetty server to
host the servlet.

1) Get the jetty 7.x distribution from eclipse.org. Unpack it anywhere. We'll
   call that directory JETTY_HOME
2) Delete the contents of JETTY_HOME/webapps.
3) Copy /conf/irc.xml to JETTY_HOME/contexts, edit the value of resourceBase in
   irc.xml to point to the contents of /servlet.
4) Copy jetty.xml and webdefault.xml to JETTY_HOME/etc
5) Copy the following jars from JETTY_HOME/lib to /servlet/WEB-INF/lib:

  jetty-client, jetty-continuation, jetty-http, jetty-io, jetty-servlets,
  jetty-util
  
6) Compile /servlet/src/org/chromium/IRCProxyWebSocket.java and put the
   resulting class file in /servlet/WEB-INF/classes
