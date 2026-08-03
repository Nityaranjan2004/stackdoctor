package com.personal.ChatApp.service;

import com.personal.ChatApp.model.dto.JoinRequest;
import com.personal.ChatApp.model.dto.JoinResponse;
import com.personal.ChatApp.model.dto.MessageResponse;
import com.personal.ChatApp.model.dto.SendMessageRequest;
import com.personal.ChatApp.model.entity.Message;
import com.personal.ChatApp.model.entity.User;
import com.personal.ChatApp.repository.MessageRepository;
import com.personal.ChatApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    
    // Store active SSE emitters by userId
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    @Override
    public JoinResponse join(JoinRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .username(request.getUsername())
                                .build()
                ));

        return JoinResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .build();
    }

    @Override
    public SseEmitter connect(Long userId) {
        // Create emitter with 24 hours timeout
        SseEmitter emitter = new SseEmitter(24 * 60 * 60 * 1000L);

        emitters.put(userId, emitter);

        // Cleanup handlers
        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(userId);
        });
        emitter.onError((ex) -> {
            emitter.completeWithError(ex);
            emitters.remove(userId);
        });

        // Send a connection confirmation event
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected successfully"));
        } catch (IOException e) {
            emitters.remove(userId);
        }

        return emitter;
    }

    @Override
    public void sendMessage(SendMessageRequest request) {
        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Message savedMessage = messageRepository.save(
                Message.builder()
                        .sender(sender)
                        .message(request.getMessage())
                        .build()
        );

        MessageResponse response = MessageResponse.builder()
                .sender(sender.getUsername())
                .message(savedMessage.getMessage())
                .sentAt(savedMessage.getSentAt())
                .build();

        broadcast("MESSAGE", response);
    }

    @Override
    public void leave(Long userId) {
        SseEmitter emitter = emitters.remove(userId);
        if (emitter != null) {
            emitter.complete();
        }
        
        userRepository.findById(userId).ifPresent(user -> {
            broadcast("LEAVE", user.getUsername() + " left the chat");
        });
    }

    private void broadcast(String eventName, Object data) {
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException e) {
                log.warn("Failed to send event to user: {}", userId, e);
                emitters.remove(userId);
            }
        });
    }
}
