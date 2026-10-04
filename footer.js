//Homepage footer - "About jotBible" (a feature overview dialog) and "Reset jotBible" (after
//confirmation, wipes all app data on this device - see resetAllData in local-db.js - and
//reloads into a fresh first-visit state)
import { resetAllData } from './local-db.js';
import { confirmDialog } from './confirm-dialog.js';

const aboutBtn = document.getElementById('about-btn');
const aboutDialog = document.getElementById('about-dialog');
const resetBtn = document.getElementById('reset-btn');
const resetDialog = document.getElementById('reset-dialog');

aboutBtn.addEventListener('click', () => aboutDialog.showModal());

//Clicking the backdrop closes it too (Escape and the Close button are handled natively)
aboutDialog.addEventListener('click', (e) => {
  if (e.target === aboutDialog) aboutDialog.close();
});

resetBtn.addEventListener('click', async () => {
  if (!(await confirmDialog(resetDialog))) return;
  resetBtn.disabled = true;
  resetBtn.textContent = 'Resetting…';
  try {
    await resetAllData();
    window.location.replace('/');
  } catch (error) {
    console.error('Reset failed:', error);
    resetBtn.disabled = false;
    resetBtn.textContent = 'Reset jotBible';
    window.alert("Reset didn't finish. Close any other jotBible tabs and try again.");
  }
});
