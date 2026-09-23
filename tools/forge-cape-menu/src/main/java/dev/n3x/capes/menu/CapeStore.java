package dev.n3x.capes.menu;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.minecraftforge.fml.loading.FMLPaths;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

final class CapeStore {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Pattern SAFE = Pattern.compile("^[^\\\\/:*?\"<>|]{1,120}\\.png$", Pattern.CASE_INSENSITIVE);
    private static final String SERVICE = "https://n3x.asterwyn.net/capes";
    private CapeStore() { }

    static Path sharedRoot() {
        String configured = System.getProperty("n3x.capes.dir", "").trim();
        if (!configured.isEmpty()) return Path.of(configured).toAbsolutePath().normalize();
        return FMLPaths.CONFIGDIR.get().toAbsolutePath().normalize();
    }
    static Path instanceRoot() { return FMLPaths.CONFIGDIR.get().toAbsolutePath().normalize(); }
    static Path library() { return sharedRoot().resolve("n3x-capes").resolve("library"); }

    static List<String> list() throws IOException {
        Path lib = library(); Files.createDirectories(lib);
        List<String> result = new ArrayList<>();
        try (var stream = Files.list(lib)) {
            stream.filter(Files::isRegularFile).map(p -> p.getFileName().toString()).filter(CapeStore::safe).forEach(result::add);
        }
        result.sort(Comparator.comparing(CapeStore::label, String.CASE_INSENSITIVE_ORDER));
        return result;
    }

    static String selected() {
        try {
            JsonObject obj = readConfig(sharedRoot());
            if (!obj.has("enabled") || obj.get("enabled").getAsBoolean()) {
                String name = string(obj, "selectedCape");
                if (safe(name) && Files.isRegularFile(library().resolve(name))) return name;
            }
        } catch (Exception ignored) { }
        return "";
    }

    static void select(String name) throws IOException {
        if (!safe(name)) throw new IOException("Ungültiger Cape-Name.");
        Path source = library().resolve(name).normalize();
        if (!source.startsWith(library()) || !Files.isRegularFile(source)) throw new IOException("Cape nicht gefunden.");
        validatePng(source);
        JsonObject shared = readConfig(sharedRoot());
        shared.addProperty("enabled", true); shared.addProperty("selectedCape", name); migrateService(shared);
        writeConfig(sharedRoot(), shared); mirrorToOldForge(shared, source);
    }

    static void disable() throws IOException {
        JsonObject shared = readConfig(sharedRoot());
        shared.addProperty("enabled", false); shared.addProperty("selectedCape", ""); migrateService(shared);
        writeConfig(sharedRoot(), shared); writeConfig(instanceRoot(), shared.deepCopy());
        Files.deleteIfExists(instanceRoot().resolve("n3x-capes").resolve("self.png"));
    }

    static String label(String name) {
        String s = name == null ? "Cape" : name.replaceFirst("(?i)\\.png$", "").replace('-', ' ');
        return s.isBlank() ? "Cape" : s;
    }

    private static void migrateService(JsonObject obj) {
        String current = string(obj, "serviceUrl");
        if (current.isBlank() || current.contains("iooimc.github.io/N3X-Launcher/network")) obj.addProperty("serviceUrl", SERVICE);
    }

    private static void mirrorToOldForge(JsonObject shared, Path source) throws IOException {
        Path oldFolder = instanceRoot().resolve("n3x-capes"); Files.createDirectories(oldFolder);
        Path temp = oldFolder.resolve("self.png.tmp"); Files.copy(source, temp, StandardCopyOption.REPLACE_EXISTING);
        try { Files.move(temp, oldFolder.resolve("self.png"), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE); }
        catch (IOException ex) { Files.move(temp, oldFolder.resolve("self.png"), StandardCopyOption.REPLACE_EXISTING); }
        writeConfig(instanceRoot(), shared.deepCopy());
    }

    private static JsonObject readConfig(Path root) {
        Path file = root.resolve("n3x-capes.json");
        try {
            if (Files.isRegularFile(file) && Files.size(file) <= 16_384) {
                var el = JsonParser.parseString(Files.readString(file, StandardCharsets.UTF_8));
                if (el.isJsonObject()) return el.getAsJsonObject();
            }
        } catch (Exception ignored) { }
        JsonObject obj = new JsonObject(); obj.addProperty("enabled", true); obj.addProperty("serviceUrl", SERVICE); obj.addProperty("selfUuid", ""); obj.addProperty("selectedCape", ""); return obj;
    }

    private static void writeConfig(Path root, JsonObject obj) throws IOException {
        Files.createDirectories(root); Path file = root.resolve("n3x-capes.json"), temp = root.resolve("n3x-capes.json.tmp");
        Files.writeString(temp, GSON.toJson(obj), StandardCharsets.UTF_8);
        try { Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE); }
        catch (IOException ex) { Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING); }
    }
    private static String string(JsonObject obj, String key) { try { return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : ""; } catch (Exception e) { return ""; } }
    private static boolean safe(String name) { return name != null && SAFE.matcher(name).matches(); }

    private static void validatePng(Path file) throws IOException {
        long size = Files.size(file); if (size < 24 || size > 1024L*1024L) throw new IOException("Cape-PNG ist ungültig oder größer als 1 MB.");
        byte[] h = new byte[24]; try (var in = Files.newInputStream(file)) { int off=0; while(off<h.length){ int n=in.read(h,off,h.length-off); if(n<0)break; off+=n; } }
        byte[] sig={(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a}; for(int i=0;i<8;i++) if(h[i]!=sig[i]) throw new IOException("Cape ist keine PNG-Datei.");
        int w=((h[16]&255)<<24)|((h[17]&255)<<16)|((h[18]&255)<<8)|(h[19]&255), he=((h[20]&255)<<24)|((h[21]&255)<<16)|((h[22]&255)<<8)|(h[23]&255);
        if(!((w==64&&he==32)||(w==128&&he==64)||(w==256&&he==128))) throw new IOException("Cape muss 64x32, 128x64 oder 256x128 sein.");
    }
}
