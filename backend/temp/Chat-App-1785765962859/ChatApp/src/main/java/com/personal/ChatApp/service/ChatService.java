package com.personal.ChatApp.service;

import com.personal.ChatApp.model.dto.JoinRequest;
import com.personal.ChatApp.model.dto.JoinResponse;
import com.personal.ChatApp.model.dto.SendMessageRequest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface ChatService {

    JoinResponse join(JoinRequest request);

    SseEmitter connect(Long userId);

    void sendMessage(SendMessageRequest request);

    void leave(Long userId);
}
