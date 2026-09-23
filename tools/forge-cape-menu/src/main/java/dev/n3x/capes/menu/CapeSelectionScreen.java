package dev.n3x.capes.menu;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.Button;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;

import java.util.List;

final class CapeSelectionScreen extends Screen {
    private final Screen parent;
    private List<String> capes = List.of();
    private int page;
    private String status = "";

    CapeSelectionScreen(Screen parent) { super(Component.literal("N3X Style")); this.parent = parent; }

    @Override protected void init() {
        try { capes = CapeStore.list(); } catch (Exception e) { capes = List.of(); status = "Fehler: " + safe(e); }
        int cx = width / 2;
        addRenderableWidget(Button.builder(Component.literal(CapeStore.selected().isEmpty() ? "✓ Kein Cape" : "Kein Cape"), b -> chooseOff()).bounds(cx-105,42,210,20).build());
        int pages = Math.max(1,(capes.size()+5)/6); page = Math.max(0,Math.min(page,pages-1)); String selected = CapeStore.selected();
        for(int i=0;i<6;i++){
            int index=page*6+i; if(index>=capes.size())break; String name=capes.get(index); String prefix=name.equals(selected)?"✓ ":"";
            addRenderableWidget(Button.builder(Component.literal(prefix+CapeStore.label(name)), b -> choose(name)).bounds(cx-105,67+i*22,210,20).build());
        }
        if(pages>1){
            Button prev=addRenderableWidget(Button.builder(Component.literal("‹"),b->{page=Math.max(0,page-1);rebuildWidgets();}).bounds(cx-105,203,45,20).build()); prev.active=page>0;
            Button mid=addRenderableWidget(Button.builder(Component.literal((page+1)+" / "+pages),b->{}).bounds(cx-55,203,110,20).build()); mid.active=false;
            Button next=addRenderableWidget(Button.builder(Component.literal("›"),b->{page=Math.min(pages-1,page+1);rebuildWidgets();}).bounds(cx+60,203,45,20).build()); next.active=page<pages-1;
        }
        addRenderableWidget(Button.builder(Component.literal("Zurück"),b->onClose()).bounds(cx-105,height-32,210,20).build());
    }

    private void choose(String name){ try{CapeStore.select(name);status=CapeStore.label(name)+" aktiviert · N3X synchronisiert automatisch";}catch(Exception e){status="Fehler: "+safe(e);} rebuildWidgets(); }
    private void chooseOff(){ try{CapeStore.disable();status="Cape deaktiviert · N3X synchronisiert automatisch";}catch(Exception e){status="Fehler: "+safe(e);} rebuildWidgets(); }

    @Override public void render(GuiGraphics graphics,int mouseX,int mouseY,float partialTick){
        renderBackground(graphics); graphics.drawCenteredString(font,Component.literal("N3X Style"),width/2,16,0xFFFFFF); graphics.drawCenteredString(font,Component.literal("Cape direkt im Spiel wechseln"),width/2,28,0xA99BCB); super.render(graphics,mouseX,mouseY,partialTick);
        if(!status.isBlank()) graphics.drawCenteredString(font,Component.literal(status),width/2,height-48,status.startsWith("Fehler")?0xFF7777:0x70E6B2);
    }
    @Override public void onClose(){ Minecraft.getInstance().setScreen(parent); }
    private static String safe(Throwable e){String s=e.getMessage();if(s==null||s.isBlank())s=e.getClass().getSimpleName();return s.length()>100?s.substring(0,100):s;}
}
