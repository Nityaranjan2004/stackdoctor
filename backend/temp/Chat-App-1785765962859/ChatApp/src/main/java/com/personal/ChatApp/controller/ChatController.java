package com.personal.ChatApp.controller;

import com.personal.ChatApp.model.dto.JoinRequest;
import com.personal.ChatApp.model.dto.JoinResponse;
import com.personal.ChatApp.model.dto.SendMessageRequest;
import com.personal.ChatApp.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/join")
    public ResponseEntity<JoinResponse> join(@Valid @RequestBody JoinRequest request) {
        return ResponseEntity.ok(chatService.join(request));
    }

    @GetMapping(value = "/connect/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@PathVariable Long userId) {
        return chatService.connect(userId);
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        chatService.sendMessage(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/leave/{userId}")
    public ResponseEntity<Void> leave(@PathVariable Long userId) {
        chatService.leave(userId);
        return ResponseEntity.ok().build();
    }
}
