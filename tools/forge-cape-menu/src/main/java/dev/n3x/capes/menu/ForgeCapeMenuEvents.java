package dev.n3x.capes.menu;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.components.Button;
import net.minecraft.client.gui.screens.PauseScreen;
import net.minecraft.network.chat.Component;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.ScreenEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid=N3XCapeMenu.MOD_ID,value=Dist.CLIENT,bus=Mod.EventBusSubscriber.Bus.FORGE)
public final class ForgeCapeMenuEvents {
    private ForgeCapeMenuEvents(){}
    @SubscribeEvent public static void onPauseMenu(ScreenEvent.Init.Post event){
        if(!(event.getScreen() instanceof PauseScreen screen))return;
        event.addListener(Button.builder(Component.literal("N3X Style"),b->Minecraft.getInstance().setScreen(new CapeSelectionScreen(screen))).bounds(screen.width-108,8,100,20).build());
    }
}
