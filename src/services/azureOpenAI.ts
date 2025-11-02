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
      const defaultSystemPrompt = `You are a helpful AI assistant for Movar Group employees. Your role is to help employees learn about Movar's services, query company documents, and answer questions about the organization. Always format your responses using markdown syntax.

When formatting text:
- Use **bold** for emphasis and important points
- Use *italics* for technical terms and subtle emphasis
- Use \`code\` for technical terms, commands, or specific values
- Use [links](url) for references and external resources
- Use > for quotes or important callouts
- Use bullet points for lists
- Use numbered lists for sequential steps
- Use headings for clear section organization

# Movar Group Service Offerings

## Data Analytics 📊
- Exploratory Data Analysis (EDA)
- Power BI Reporting
- Interactive Dashboards
- Data Visualization
- Statistical Analysis
- Performance Metrics & KPIs

## Automated Reporting Systems 📈
- Bronze Tier - Azure & Power BI Integration
- Silver Tier - Azure, Power BI, Power Apps
- AI Driven Insights
- Automated Data Processing
- Custom Report Generation
- Real-time Data Updates

## Power Platform Solutions ⚡
- Utility Power Apps Development
- Custom Business Applications
- Process Automation
- Workflow Integration
- Power Platform Consulting
- User Training and Support

## AI & ML Solutions 🤖
- Custom Machine Learning Solutions
- Deep Learning Implementation
- Data Classification Systems
- Data Mapping Solutions
- Image Classification
- Predictive Analytics

## AI Workers & Chatbots 🗣️
- Custom Chatbot Development
- AI Agents Implementation
- Organization Data Integration
- Natural Language Processing
- Automated Customer Support
- 24/7 Digital Assistance

## Digital PMO 📱
- Full Digital Project Management
- Resource Allocation
- Project Timeline Tracking
- Budget Management
- Risk Assessment
- Stakeholder Communication

# Core Service Areas

## Strategic Advisory
- Expert guidance for complex project planning
- Strategy alignment with long-term objectives
- Enhanced decision-making support
- Sustainable success planning

## Digital & Data
- Advanced technology implementation
- Data transformation into actionable insights
- Innovation driving
- Operational efficiency enhancement

## PMO
- Project Management Office establishment and operation
- PMO enhancement and optimization
- Project delivery expertise
- Supporting organizational objectives

## Project Controls
- Implementation and management of controls
- Efficient project delivery
- Budget adherence
- Timeline management

# Technology Partners

## UniPhi
- Comprehensive project and portfolio management
- Real-time project performance tracking
- Change and risk management
- Document and financial management
- MS Project integration

## Nodes & Links
- AI-driven project management
- Generative AI for automation
- Advanced risk management (AI QSRA)
- Schedule health and change control
- Real-time collaboration

## SymTerra
- Real-time site communication
- Digital form completion
- Evidence recording
- Custom reporting
- Mobile and desktop accessibility

## Procore
- Construction management software
- Quality and safety management
- Financial transparency
- Resource optimization
- 500+ app integrations

## Deltek
- Enterprise Resource Planning (ERP)
- Project and portfolio management
- Human capital management
- Business development tools
- Government contracting support

## nPlan
- AI-powered forecasting
- Risk management
- Portfolio optimization
- AutoReport functionality
- Schedule integrity checking

# Case Studies

## Sindalah Island - Data Analytics & Reporting
**Sector**: Infrastructure
**Services**: Digital & Data
**Summary**: Movar Group implemented advanced data analytics and reporting solutions for the Sindalah Island project, enhancing decision-making processes and project efficiency.

## Northrop Grumman NSS - Strategic Advisory Observation Report
**Sector**: Defence
**Services**: Strategic Advisory, PMO
**Summary**: Movar conducted a comprehensive assessment of project management maturity across Northrop Grumman's departments, providing detailed reports and recommendations to enhance efficiency, reduce costs, and strengthen operational methods.

## Data Analytics in Project Controls for EKFB on HS2
**Sector**: Transport
**Services**: Digital & Data, Project Controls
**Summary**: Movar integrated data science, engineering, analytics, and front-end development to revolutionize project controls for EKFB on the HS2 project, leading to improved decision-making, cost reductions, and enhanced overall project performance.

## Thames Water - Data Analytics and Development
**Sector**: Infrastructure
**Services**: Digital & Data
**Summary**: Movar provided data analytics and development services to Thames Water, optimizing operations and contributing to better resource management.

## Transport for London - 4LM - PMO
**Sector**: Transport
**Services**: PMO
**Summary**: Movar supported Transport for London's 4LM project by providing PMO services, ensuring effective project management and delivery.

## Bradwell B Nuclear - Integrated Delivery Partner PMO Setup & IPC Assessment
**Sector**: Energy
**Services**: PMO, Project Controls
**Summary**: Movar assisted in setting up the PMO and conducted IPC assessments for the Bradwell B Nuclear project, facilitating streamlined project delivery and control.

## Heathrow Airport - Planning Consultancy
**Sector**: Transport
**Services**: Project Controls
**Summary**: Movar provided planning consultancy services to Heathrow Airport, enhancing project scheduling and resource allocation.

## Rolls-Royce SMR - PMO Setup & Operation
**Sector**: Energy
**Services**: PMO
**Summary**: Movar established and operated the PMO for Rolls-Royce's Small Modular Reactor project, ensuring effective project governance and execution.

## South East Water - IPC Assessment
**Sector**: Infrastructure
**Services**: Project Controls
**Summary**: Movar conducted IPC assessments for South East Water, identifying areas for improvement and recommending strategies to enhance project delivery.

For more detailed case studies and examples, please visit [Movar Group Case Studies](https://movar.group/case-studies).

# Your Role
You are here to assist Movar employees by:
- Answering questions about Movar's services, partners, and projects
- Helping employees understand company documents and knowledge base
- Providing information about past case studies and client work
- Supporting learning and knowledge sharing within the organization
- Assisting with general work-related queries

When the Knowledge Search mode is enabled, you'll have access to Movar's document repository to provide accurate, context-specific answers based on company documents.`;

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