import Source from "gi://GtkSource";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

export default function Document({ code_view, placeholder, file }) {
  const { buffer } = code_view;
  let handler_id = null;

  const source_file = new Source.File({
    location: file,
  });

  loadSourceBuffer({ file: source_file, buffer })
    .then((success) => {
      if (!success) code_view.replaceText(placeholder, true);
    })
    .catch(logError);
  start();

  function save() {
    saveSourceBuffer({ file: source_file, buffer }).catch(logError);
  }

  function start() {
    stop();
    handler_id = buffer.connect("modified-changed", () => {
      if (!buffer.get_modified()) return;
      save();
    });
  }

  function stop() {
    if (handler_id !== null) {
      buffer.disconnect(handler_id);
      handler_id = null;
    }
  }

  return { start, stop, save, code_view, file };
}

async function saveSourceBuffer({ file, buffer }) {
  const file_saver = new Source.FileSaver({
    buffer,
    file,
  });
  const success = await file_saver.save_async(
    GLib.PRIORITY_DEFAULT,
    null,
    null,
  );
  if (success) {
    buffer.set_modified(false);
  }
}

async function loadSourceBuffer({ file, buffer }) {
  const file_loader = new Source.FileLoader({
    buffer,
    file,
  });
  let success;
  try {
    success = await file_loader.load_async(GLib.PRIORITY_DEFAULT, null, null);
  } catch (err) {
    if (err.code !== Gio.IOErrorEnum.NOT_FOUND) {
      throw err;
    }
  }

  if (success) {
    buffer.set_modified(false);
  }
  return success;
}
