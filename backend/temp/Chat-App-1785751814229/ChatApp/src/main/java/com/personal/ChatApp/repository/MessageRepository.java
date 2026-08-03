package com.personal.ChatApp.repository;

import com.personal.ChatApp.model.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
}
