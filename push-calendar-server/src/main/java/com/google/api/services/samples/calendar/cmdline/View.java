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

package com.google.api.services.samples.calendar.cmdline;

import com.google.api.services.calendar.model.Calendar;
import com.google.api.services.calendar.model.CalendarList;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;


/**
 * @author Yaniv Inbar - This is copied from the Google Calendar command line sample app.
 */
public class View {

  static void header(String name) {
    System.out.println();
    System.out.println("============== " + name + " ==============");
    System.out.println();
  }

  static void display(CalendarList feed) {
    if (feed.getItems() != null) {
      for (CalendarListEntry entry : feed.getItems()) {
        System.out.println();
        System.out.println("-----------------------------------------------");
        display(entry);
      }
    }
  }

  static void display(Events feed) {
    if (feed.getItems() != null) {
      for (Event entry : feed.getItems()) {
        System.out.println();
        System.out.println("-----------------------------------------------");
        display(entry);
      }
    }
  }

  static void display(CalendarListEntry entry) {
    System.out.println("ID: " + entry.getId());
    System.out.println("Summary: " + entry.getSummary());
    if (entry.getDescription() != null) {
      System.out.println("Description: " + entry.getDescription());
    }
  }

  static void display(Calendar entry) {
    System.out.println("ID: " + entry.getId());
    System.out.println("Summary: " + entry.getSummary());
    if (entry.getDescription() != null) {
      System.out.println("Description: " + entry.getDescription());
    }
  }

  static void display(Event event) {
    if (event.getStart() != null) {
      System.out.println("Start Time: " + event.getStart());
    }
    if (event.getEnd() != null) {
      System.out.println("End Time: " + event.getEnd());
    }
    if (event.getSummary() != null) {
      System.out.println("Event summary: " + event.getSummary());
    }
  }
}
