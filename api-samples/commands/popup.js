// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

async function listCommands() {
  const commands = await chrome.commands.getAll();
  const container = document.getElementById('commands');

  for (const command of commands) {
    const row = document.createElement('div');
    row.className = 'command-row';

    const name = document.createElement('span');
    name.className = 'command-name';
    name.textContent = command.description || command.name;

    const shortcut = document.createElement('kbd');
    shortcut.textContent = command.shortcut || 'Not set';

    row.appendChild(name);
    row.appendChild(shortcut);
    container.appendChild(row);
  }
}

listCommands();
