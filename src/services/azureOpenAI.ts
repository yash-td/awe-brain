import axios from 'axios';
import { Message, AzureOpenAIModel, FileAttachment } from '../types';

class AzureOpenAIService {
  private apiKey: string;
  private endpoint: string;
  private apiVersion: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
    this.endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
    this.apiVersion = '2024-12-01-preview';
  }

  async sendMessage(
    messages: Message[],
    model: AzureOpenAIModel,
    attachments?: FileAttachment[],
    customSystemPrompt?: string
  ) {
    try {
      if (!this.apiKey || !this.endpoint) {
        throw new Error('Azure OpenAI configuration is missing');
      }

      const formattedMessages = await this.formatMessages(messages, attachments);

      // Use custom system prompt if provided, otherwise use default
      const defaultSystemPrompt = `You are a helpful AI assistant for AWE (Atomic Weapons Establishment). Your role is to support AWE personnel by providing information, querying organizational documents, and assisting with knowledge-based inquiries. Always format your responses using markdown syntax.

When formatting text:
- Use **bold** for emphasis and important points
- Use *italics* for technical terms and subtle emphasis
- Use \`code\` for technical terms, commands, or specific values
- Use [links](url) for references and external resources
- Use > for quotes or important callouts
- Use bullet points for lists
- Use numbered lists for sequential steps
- Use headings for clear section organization

# About AWE (Atomic Weapons Establishment)

AWE is responsible for the design, manufacture, and support of warheads for the United Kingdom's nuclear deterrent. As a mission-critical organization, AWE operates with the highest standards of safety, security, and technical excellence.

## Our Mission
**Together, delivering solutions for a safe and secure future.**

We provide expert nuclear weapons services to the UK Ministry of Defence, ensuring the effectiveness and safety of the UK's Continuous At-Sea Deterrent (CASD).

## Core Capabilities

### Nuclear Warhead Design & Manufacture
- Design and manufacture of nuclear warheads
- Warhead systems engineering
- Nuclear materials science and technology
- Advanced manufacturing and precision engineering

### Nuclear Security & Safety
- Nuclear security operations
- Safety analysis and assurance
- Environmental monitoring and protection
- Radiation protection

### Research & Development
- Advanced research facilities
- Cutting-edge scientific capabilities
- Collaboration with academia and industry
- Innovation in nuclear technology

### Technical Services
- Warhead support and maintenance
- Systems integration
- Quality assurance and testing
- Technical documentation and knowledge management

## Organizational Values

- **Safety**: Safety is our top priority in everything we do
- **Security**: Maintaining the highest security standards
- **Integrity**: Operating with honesty and transparency
- **Respect**: Valuing diversity and treating everyone with respect
- **Simplicity**: Focusing on what matters most

## Facilities & Infrastructure

AWE operates from two main sites:
- **AWE Aldermaston** (Berkshire) - Main design and manufacturing facility
- **AWE Burghfield** (Berkshire) - Warhead assembly and disassembly

Our facilities include some of the most advanced research and production capabilities in the world, including high-performance computing, advanced materials laboratories, and precision manufacturing centers.

# Your Role

You are here to assist AWE personnel by:
- Answering questions about AWE's mission, capabilities, and operations
- Helping personnel access and understand organizational documents
- Providing information from the AWE knowledge base
- Supporting learning and knowledge sharing within the organization
- Assisting with general work-related queries
- Maintaining professionalism and security awareness in all responses

**Important**: When the Knowledge Search mode is enabled, you'll have access to AWE's document repository to provide accurate, context-specific answers based on organizational documents.

Always maintain the appropriate level of professionalism and security awareness when responding to queries. If asked about classified or sensitive information, remind users to follow proper security protocols.`;

      const systemMessage = {
        role: 'system',
        content: customSystemPrompt || defaultSystemPrompt
      };

      const requestBody = {
        messages: [systemMessage, ...formattedMessages],
        max_completion_tokens: model.maxTokens || 4000,
        stream: false
      };

      const response = await axios.post(
        `${this.endpoint}/openai/deployments/${model.deployment}/chat/completions?api-version=${this.apiVersion}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;

      // Debug: Log response details
      console.log('📨 Azure OpenAI Response received');
      console.log('Response length:', aiResponse?.length || 0);
      console.log('Response preview:', aiResponse?.substring(0, 200) || '[EMPTY]');

      // Check if response is empty or just whitespace
      if (!aiResponse || aiResponse.trim().length === 0) {
        console.warn('⚠️ AI returned empty response');
        return 'I apologize, but I was unable to generate a response. This might be due to the file size or format. Could you try with a smaller file or rephrase your question?';
      }

      return aiResponse;

    } catch (error) {
      console.error('Azure OpenAI API error:', error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Azure OpenAI API error (${status}): ${message}`);
      }
      throw new Error('Failed to connect to Azure OpenAI service');
    }
  }

  private async formatMessages(messages: Message[], attachments?: FileAttachment[]) {
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add file contents to the last user message if there are attachments
    if (attachments && attachments.length > 0) {
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        let content = lastMessage.content;

        for (const attachment of attachments) {
          if (attachment.parsedContent) {
            const { text, metadata } = attachment.parsedContent;

            // Debug: Log attachment details
            console.log(`📎 Processing attachment: ${attachment.name}`);
            console.log(`   File type: ${metadata.fileType}`);
            console.log(`   Word count: ${metadata.wordCount}`);
            console.log(`   Content length: ${text.length} characters`);
            console.log(`   Content preview: ${text.substring(0, 300)}...`);

            content += `\n\n--- File: ${attachment.name} (${metadata.fileType}) ---`;

            if (metadata.wordCount > 0) {
              content += `\nWord count: ${metadata.wordCount}`;
            }

            if (metadata.pages) {
              content += `\nPages: ${metadata.pages}`;
            }

            // Limit content size to avoid token limits (max ~100k characters for large CSV)
            const MAX_CONTENT_LENGTH = 100000;
            const truncatedText = text.length > MAX_CONTENT_LENGTH
              ? text.substring(0, MAX_CONTENT_LENGTH) + `\n\n[... Content truncated. Original file had ${text.length} characters, showing first ${MAX_CONTENT_LENGTH}]`
              : text;

            content += `\nContent:\n${truncatedText}`;

            if (text.length > MAX_CONTENT_LENGTH) {
              console.warn(`⚠️ File content truncated from ${text.length} to ${MAX_CONTENT_LENGTH} characters`);
            }

            // For images, include the base64 data for vision models
            if (attachment.type.startsWith('image/')) {
              content += `\n[Image data available for analysis]`;
            }
          } else {
            // Fallback for files that couldn't be parsed
            content += `\n\n--- File: ${attachment.name} ---`;
            content += `\nType: ${attachment.type}`;
            content += `\nSize: ${Math.round(attachment.size / 1024)}KB`;
            content += `\n[File content could not be extracted for analysis]`;
          }
        }

        console.log(`📝 Final message length being sent to AI: ${content.length} characters`);
        lastMessage.content = content;
      }
    }

    return formattedMessages;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage([
        { id: 'test', role: 'user', content: 'Hello', timestamp: new Date() }
      ], {
        id: 'test',
        name: 'Test',
        deployment: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT,
        description: 'Test',
        maxTokens: 100
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const azureOpenAIService = new AzureOpenAIService();