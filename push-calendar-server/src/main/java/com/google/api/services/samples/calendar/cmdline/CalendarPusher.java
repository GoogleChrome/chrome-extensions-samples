/*
 * Copyright (c) 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

// TODO: Check against google java coding style guidelines.

/* Instructions:
 *   See http://developer.chrome.com/apps/pushMessaging.html for general instructions for
 *   Push Messaging.
 *   To run this, you will need to first set up the project to compile, then get the proper
 *   keys.  You will need to use OAuth2Playground as described in the gcm_for_chrome doc
 *   (here - http://developer.chrome.com/apps/gcm_server.html)
 *   to fill in the client secret, refresh token, and client id in the secrets.txt file.
 *   You will need to have a google calendar based on a gmail account with some appointments
 *   within the next day.  You will also need to get a client id and client secret to your google
 *   calendar as described in instructions.html in this project, and put them into the placeholders
 *   in the client_secrets.json file.
 *   You will need to run the push messaging sample app to find the user ID portion of the 
 *   channel ID to use for sending the message to (the push messaging sample app can also
 *   recieve the push messages and display them).  It is available in the Chrome Web Store at
 *   https://chrome.google.com/webstore/detail/push-messaging-sample-cli/fboilmbenheemaomgaeehigklolhkhnf
 *   You will use the userID in the "ChannelID" variable in secrets.txt.
 *   
 *   secrets.txt is a plain text file with one line per string.  The format is as follows:
 *   <ChannelID to use>
 *   <ClientId to use>
 *   <Client Secret to use>
 *   <Refresh Token>
 */

package com.google.api.services.samples.calendar.cmdline;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.java6.auth.oauth2.FileCredentialStore;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Calendar;
import com.google.api.services.calendar.model.CalendarList;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;
import com.google.common.collect.Lists;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLConnection;
import java.util.Collections;
import java.util.Date;
import java.util.Scanner;

/**
 * CalendarPusher is a server side program to run to get upcoming appointments, and send
 * push messages to a push message client.  This version connects to google calendar,
 * gets appointments,gets an authentication token, and then sends the push message. This is meant
 * as a working demo of how a server could send push messages to the Google Apiary Push Messaging
 * service.  To make it work for you, you will also need to follow the instructions in 
 * "instructions.html" in this project to get your own client_secrets.json, which will let you log
 * into the Google calendar server.
 */
public class CalendarPusher {

  /** Global instance of the HTTP transport. */
  private static final HttpTransport HTTP_TRANSPORT = new NetHttpTransport();

  /** Global instance of the JSON factory. */
  private static final JsonFactory JSON_FACTORY = new JacksonFactory();
  
  private static final long MILLIS_PER_MINUTE = 1000 * 60;
  
  private static final long MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

  /** The google API for accessing the calendar. */
  private static com.google.api.services.calendar.Calendar client;
  
  
  /** The channel ID of the user that you want to send to.  The first half is an encrypted user ID.
   *  The second half is the extension ID of the chrome extension that you have the user install. 
   *  So, when you are testing, you can use the Push Messaging Sample App to find the proper user ID
   *  for your test user (the part before the slash), and you can put your chrome extension ID for
   *  your chrome extension (the one that you get from Chrome Web Store) after the slash to
   *  construct a channel ID you can test with.
   */
  private static String channelId;
  
  /** The client ID that you get from the Google API console for your server. */
  private static String clientId;

  /** The client secret that you got from the Google API console for your server. */
  private static String clientSecret;
  
  /** The refresh token that you get from the Google API console for your server. */
  private static String refreshToken;


  static final java.util.List<Calendar> addedCalendarsUsingBatch = Lists.newArrayList();
  
  /** Read the secrets from the secrets.txt file and initialize the secret variables */
  private static void ReadSecretsFile() throws FileNotFoundException {
    Scanner in = new Scanner(new FileReader("src/main/resources/secrets.txt"));
    String line;
    
    // A more robust solution would use a JSON file and a JSON library. I have deliberately
    // done this more simply to minimize dependencies for the sample.

    // The first line is the ChannelID.  It should look like this:
    // 01267435699999999999/fboilmbenheemaomgaeehigklolhkhnf
    line = in.nextLine();
    channelId = line;
    
    // The second line is the ClientID.  It should look like this:
    // 829999999999.apps.googleusercontent.com
    line = in.nextLine();
    clientId = line;
    
    // The third line is the client secret.  Make sure you don't lose this, and limit the 
    // number of people with access to it.  It looks like this:
    // E_JzDFQeZQDfz2cd8TArtw7l&
    line = in.nextLine();
    clientSecret = line;
    
    // the fourth line is the refresh token.  Make sure you don't lose this, and limit the 
    // number of people with access to it.  It looks like this:
    // 1/g8_5xnbwwAgn_EPsEW1G7S65qF5NOOlQaaaOAOAAAaa&
    line = in.nextLine();
    refreshToken = line;
  }

  /** Authorizes the installed application to access user's protected data. */
  private static Credential authorize() throws Exception {
    // Load client secrets from client_secrets.json file as described in the docs
    // for the Google Calendar API.
    GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
        JSON_FACTORY, CalendarPusher.class.getResourceAsStream("/client_secrets.json"));
    if (clientSecrets.getDetails().getClientId().startsWith("Enter")
        || clientSecrets.getDetails().getClientSecret().startsWith("Enter ")) {
      System.out.println(
          "Enter Client ID and Secret from https://code.google.com/apis/console/?api=calendar "
          + "into <this project>/src/main/resources/client_secrets.json");
      System.exit(1);
    }
    // Set up file credential store.
    FileCredentialStore credentialStore = new FileCredentialStore(
        new File(System.getProperty("user.home"), ".credentials/calendar.json"), JSON_FACTORY);
    // Set up authorization code flow.
    GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
        HTTP_TRANSPORT, JSON_FACTORY, clientSecrets,
        Collections.singleton(CalendarScopes.CALENDAR)).setCredentialStore(credentialStore).build();
    // Authorize this user to access the calendar.
    return new AuthorizationCodeInstalledApp(flow, new LocalServerReceiver()).authorize("user");
  }

  public static void main(String[] args) {
    try {
      try {
        // Get the secrets and keys we need to call the apis
        ReadSecretsFile();
        
        // Authorize this user to make a call to get the calendar data.
        Credential credential = authorize();

        // Set up global Calendar instance.
        client = new com.google.api.services.calendar.Calendar.Builder(
            HTTP_TRANSPORT, JSON_FACTORY, credential).setApplicationName(
            "Google-CalendarSample/1.0").build();

        // Show events for today in stdout (enable this if you want debugging aids).
        // showTodayEvents();
        
        // Send the events for the next day as Push Messages.
        pushTodayEvents();

      } catch (IOException e) {
        System.err.println(e.getMessage());
      }
    } catch (Throwable t) {
      t.printStackTrace();
    }
    System.exit(1);
  }

  /**
   * Get today's main calendar and show the events for me.
   * This is used for debugging to print calendar events to the console.
   * @throws IOException 
   */
  private static void showTodayEvents() throws IOException {

    // Get the calendar that we want from the list of calendars.
    // There are multiple calendars, for this demo we just assume last one is the one we want.
    CalendarList feed = client.calendarList().list().execute();
    
    CalendarListEntry calendarListEntry = null;
    for (CalendarListEntry entry : feed.getItems()) {
      calendarListEntry = entry;
    }
    
    // Get the calendar events.
    Events eventsFeed = client.events().list(calendarListEntry.getId()).execute();
    
    // Call the Show method.
    View.header("Today's events");
    View.display(eventsFeed);
    
  }
  
  /**
   * Get today's main calendar, and post the events to the supplied channelId.
   * @throws IOException 
   */
  private static void pushTodayEvents() throws IOException {

    // Get the calendars from the list.
    CalendarList feed = client.calendarList().list().execute();

    
    // Get the calendar that we want from the list of calendars.
    // There are multiple calendars, for this demo we just assume last one is the one we want.
    CalendarListEntry calendarListEntry = null;
    for (CalendarListEntry entry : feed.getItems()) {
      calendarListEntry = entry;
    }
    
    // Get the events from the calendar.
    Events eventsFeed = client.events().list(calendarListEntry.getId()).execute();
    
    // For each event within one day from now, push message the event with the time until it happens.
    if (eventsFeed.getItems() != null) {
      for (Event event : eventsFeed.getItems()) {
        String eventTitle = event.getSummary();
        long numMinutes = 5;
        
        // Get the time of the event.
        EventDateTime eventTime = event.getStart();
        DateTime eventDateTime = eventTime.getDateTime();
        DateTime now = new DateTime(new Date());
        long eventMillis = eventDateTime.getValue();
        long nowMillis = now.getValue();
        
        // Ignore events in the past, or more than one day in the future.
        long diffMillis = eventMillis - nowMillis;
        if (diffMillis < 0 || diffMillis > MILLIS_PER_DAY) {
          continue;
        }
        
        // Calculate the time until the event.
        numMinutes = diffMillis/MILLIS_PER_MINUTE;
        
        // Push a reminder with event title and time.
        pushEvent(numMinutes, channelId, eventTitle);
      }
    }
  }
  
  // Send a push message.
  private static void pushEvent(long numMinutes, String channelId, String title) {
    String message = Integer.toString((int)numMinutes) + " minutes until " + title;
    
    // Re-enable this logging line if you need some debugging aids.
    // System.out.println(message);
    
    // Make an HTML request to retrieve an access token.
    String accessToken = getAccessToken();
    
    // Make a second HTML request to send the message using the access token.
    if (null != accessToken) {
      sendPushRequest(accessToken, channelId, message);
    }
  }

  // The code in this function does the equivalent of the following bash shell script.
  // You could also use the script itself in your debugging, so I left it here.
  // Use the user's refresh token to get an access token, put it into an environment
  // variable called accesstoken after parsing the token out of the HTTP output.
  // accesstoken=(`curl -s https://accounts.google.com/o/oauth2/token 
  //                    -d "client_secret=E_IgAGTeZQDfzOxxxxxXXXXX&
  //                        grant_type=refresh_token&
  //                        refresh_token=1/g8_5xnbxxAgn_EPsEW1D7S65qF5NOOlQyxxxxxXXXXX&
  //                         client_id=829999999999.apps.googleusercontent.com" 
  //              | grep "access_token" | awk -F\" '{print $4}'`)

  /**
   * getAccessToken will send the first Web API call to get the access token,
   * parse it, and return the token that it finds, synchronously.
   * @return access token for this <client ID, secret> pair.
   */
  private static String getAccessToken() {
    
    String foundToken = "";
    
    try {
      URL tokenUrl = new URL("https://accounts.google.com/o/oauth2/token");

      URLConnection connection = tokenUrl.openConnection();

      // Re-enable this line if you want some debugging aids.
      // System.out.println("connection URL is " + connection.getURL().toString());
      
      String data = "client_secret=" + clientSecret + 
                    "grant_type=refresh_token&" +
                    "refresh_token=" + refreshToken + 
                    "client_id=" + clientId;

      // Send the data to the google Push Messaging server.
      System.out.println("URL payload is " + data);
      connection.setDoOutput(true);
      OutputStreamWriter out = new OutputStreamWriter(connection.getOutputStream());
      out.write(data);
      out.close();
      
      // Get the response from the server.
      BufferedReader in = new BufferedReader(
                              new InputStreamReader(
                              connection.getInputStream()));

      String inputLine;

      // Process the output line, looking for an access token.
      // It would be easier and more robust to do this with a JSON library, but I wanted to keep
      // dependencies minimal for this sample.
      //System.out.println("Output from the XHR #1");
      while ((inputLine = in.readLine()) != null) {
        // Re-enable this if you want some aids with debugging.
        //System.out.println(inputLine);
        String[] results = inputLine.split("[ :\",]+");
        if (results.length > 2 && results[1].equals("access_token")) {
          foundToken = results[2];
        }
        
      }
      in.close();
    } catch (IOException e) {
      System.out.println("Error while trying to get the access token");
      System.err.println(e.getMessage());
    } 
    
    return foundToken;
  }

  // The code in the next function tries to do the same thing as this small bash script.
  //# Send a push message.
  //# This channelID is for the version of the push messaging sample app in the chrome web store,
  //# using the refresh token.
  // curl -s -H "Authorization: Bearer $accesstoken" 
  //         -H "Content-Type: application/json" 
  //      https://www.googleapis.com/gcm_for_chrome/v1/messages
  //      -d "{'channelId': '01267435699999999999/fboilmbenheemaomgaeehigklolhkhnf', 
  //           'subchannelId': '0', 'payload': 'Hello push messaging!'}"

  /**
   * sendPushRequest will send the second web API call to request the servers to push the message
   * @param accessToken Token needed to provide authentication for the request.
   * @param message What we want to push.
   * 
   */
  private static void sendPushRequest(String accessToken, String channelId, String message) {
    try {
      URL pushServerUrl = new URL("https://www.googleapis.com/gcm_for_chrome/v1/messages");
    
      URLConnection connection = pushServerUrl.openConnection();

      // Set up the headers that we need.
      connection.setRequestProperty("Authorization", "Bearer " + accessToken);
      connection.setRequestProperty("Content-Type", "application/json");
      
      // Set up the data.  I've arbitrarily chosen channel 3, any channel 0-3 will work.
      String payload = "{'channelId': '" + channelId + "', 'subchannelId': '3', 'payload': '" +
                       message + "'}";
      
      // Re-enable these debugging print statements if you would like some debugging aids.
      // System.out.println("payload is " + payload);
      // System.out.println("access token is " + accessToken);
      
      // Send the data to the server.
      connection.setDoOutput(true);
      OutputStreamWriter out = new OutputStreamWriter(connection.getOutputStream());
      out.write(payload);
      out.close();
      
      // Get the reply from the server for our logs, and to see if we succeeded.
      BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
      
      String resultString;
      System.out.println("Output from Web API call to Push Messaging");
      while ((resultString = in.readLine()) != null) {
        System.out.println(resultString);
      }
      in.close();
      
    } catch (IOException e) {
      System.out.println("Error while trying to send the push message");
      System.err.println(e.getMessage());
    }
    
  }

}
