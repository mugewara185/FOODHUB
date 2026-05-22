# React Developer Framework - Visual Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph RDF["React Developer Framework (RDF)"]
        subgraph DF["DataFactory<br/>(Schema-Driven)"]
            S1["Schema Definition<br/>(SchemaDef)"]
            FG["Field Generators<br/>(Faker, Custom)"]
            FR["Factory Registry<br/>(In-Memory)"]
            PE["Persistence<br/>(File, DB, JSON)"]
            S1 --> FG
            FG --> FR
            FR --> PE
        end

        subgraph LOG["Logger<br/>(Structured)"]
            LC["Logger Core<br/>(LogEntry, LogLevel)"]
            DL["Domain Loggers<br/>(API, Redux, Component)"]
            FLT["Filtering & Query<br/>(Namespace, Level, Tags)"]
            EXP["Export<br/>(JSON, CSV, HTML)"]
            LC --> DL
            DL --> FLT
            FLT --> EXP
        end

        subgraph DT["DevToolkit<br/>(Utilities)"]
            API["API Simulator<br/>(Delays, Errors)"]
            FT["Feature Toggle<br/>(Dev Features)"]
            ES["Error Simulator<br/>(Error Injection)"]
            API --> FT
            FT --> ES
        end

        subgraph SH["Shared Layer<br/>(Reusable)"]
            H["Hooks<br/>(useApi, useLocalStorage)"]
            U["Utils<br/>(Formatters, Validators)"]
            C["Constants<br/>(HTTP, Errors)"]
            T["Types<br/>(Common Interfaces)"]
            H --> U
            U --> C
            C --> T
        end
    end

    subgraph APP["Your React App"]
        COMP["Components"]
        STORE["Redux Store"]
        SERV["Services/API"]
        COMP --> STORE
        STORE --> SERV
    end

    RDF --> APP
    DF -.->|Preload State| STORE
    LOG -.->|Track Flow| COMP
    LOG -.->|Track Actions| STORE
    LOG -.->|Track Requests| SERV
    DT -.->|Simulate| SERV
    SH -.->|Utilities| COMP

    style RDF fill:#e1f5ff
    style DF fill:#fff3e0
    style LOG fill:#f3e5f5
    style DT fill:#e8f5e9
    style SH fill:#fce4ec
    style APP fill:#f1f8e9
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph INPUT["Input"]
        SCHEMA["Schema Definition<br/>{ id: uuid, name, ...}"]
        OPTS["Options<br/>{ count, overrides, seed }"]
    end

    subgraph FACTORY["DataFactory Processing"]
        BUILDER["Build Instance"]
        GEN["Generate with Generators"]
        MERGE["Apply Overrides"]
        LINK["Link Relations"]
    end

    subgraph OUTPUT["Output"]
        MEM["In-Memory<br/>Object[]"]
        FILE["File Export<br/>JSON/CSV"]
        DB["MongoDB<br/>Persistence"]
    end

    SCHEMA --> BUILDER
    OPTS --> BUILDER
    BUILDER --> GEN
    GEN --> MERGE
    MERGE --> LINK
    LINK --> MEM
    LINK --> FILE
    LINK --> DB

    style INPUT fill:#fff9c4
    style FACTORY fill:#ffccbc
    style OUTPUT fill:#c8e6c9
```

## Logger Data Flow

```mermaid
graph TD
    subgraph APP["Application Events"]
        API["API Calls"]
        REDUX["Redux Actions"]
        COMP["Component Lifecycle"]
        AUTH["Auth Flow"]
        PERF["Performance Spans"]
    end

    subgraph LOGGER["Logger Core"]
        ENTRY["Create LogEntry<br/>(id, level, namespace, data)"]
        FILTER["Filtering Rules<br/>(level, namespace, tags)"]
        FORMAT["Format Output<br/>(color, structure)"]
        STORE["Store in Buffer<br/>(maxLogs: 500)"]
    end

    subgraph PERSIST["Persistence"]
        LOCALSTORAGE["localStorage"]
        INDEXEDDB["IndexedDB<br/>(Future)"]
    end

    subgraph QUERY["Query & Export"]
        GET["getLogs()<br/>getByNamespace()"]
        STATS["getStats()<br/>statsByNamespace()"]
        EXP["export()<br/>JSON/CSV/HTML"]
    end

    API --> ENTRY
    REDUX --> ENTRY
    COMP --> ENTRY
    AUTH --> ENTRY
    PERF --> ENTRY
    ENTRY --> FILTER
    FILTER --> FORMAT
    FORMAT --> STORE
    STORE --> LOCALSTORAGE
    STORE --> INDEXEDDB
    LOCALSTORAGE --> GET
    GET --> STATS
    STATS --> EXP

    style APP fill:#bbdefb
    style LOGGER fill:#c5e1a5
    style PERSIST fill:#ffe0b2
    style QUERY fill:#f8bbd0
```

## Component Integration Pattern

```mermaid
graph TD
    A["App Root"] -->|RDFProvider| B["Framework Context"]
    B -->|useFactory| C["Component A"]
    B -->|useLogger| D["Component B"]
    B -->|useDevMode| E["Component C"]
    
    C -->|create()| F["DataFactory"]
    D -->|info()| G["Logger"]
    E -->|setDelay()| H["API Simulator"]
    
    F -->|preload| I["Redux Store"]
    G -->|track| I
    H -->|simulate| J["API Layer"]
    
    J -->|fetch| K["Real Backend<br/>or Mock"]

    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e8f5e9
```

## Redux Integration with Framework

```mermaid
graph TB
    subgraph SETUP["Redux Setup"]
        CF["configureStore()"]
        PM["Preload Middleware"]
        LM["Logger Middleware"]
    end

    subgraph ACTION["Action Flow"]
        DC["Dispatch Component"]
        PREP["Prepare<br/>Action with Logger"]
        REDUCE["Reducer<br/>Process"]
        LG["Logger tracks state"]
    end

    subgraph STATE["State Management"]
        SS["Store State<br/>from Factory"]
        PS["Persist to Storage"]
        SYNC["Sync across Tabs"]
    end

    CF --> SS
    PM --> SS
    LM --> LG
    DC --> PREP
    PREP --> REDUCE
    REDUCE --> LG
    LG --> PS
    PS --> SYNC

    style SETUP fill:#c8e6c9
    style ACTION fill:#fff9c4
    style STATE fill:#bbdefb
```

## Timeline: Integration Flow

```mermaid
timeline
    title Framework Integration Timeline

    section Development
        Define Schemas : schema.ts : Define user, restaurant, order schemas
        Init Factory : init.ts : Create factory, logger, devTools instances
        Generate Data : preload : Use factory to preload Redux state
        Setup Logging : middleware : Add logger middleware to Redux
        
    section Feature Building
        Use Hooks : useApi : Replace fetch with framework hooks
        Log Actions : dispatch : Log Redux actions via middleware
        Track Components : effects : Log component lifecycle
        Expose DevTools : window.__DEV__ : Access tools from console
        
    section Testing & Debugging
        Simulate API : setDelay : Add network delays for testing
        Inject Errors : setError : Test error handling
        Feature Toggle : features : Toggle features for A/B testing
        Filter Logs : getLogs : Query logs by namespace/level
        
    section Production
        Remove Mocks : Switch from factory : Replace with real API
        Cleanup Logs : minLevel: WARN : Only log warnings and errors
        API Integration : Real endpoints : Connect to actual backend
        Monitor : Errors : Track errors with Sentry
```

## File Structure Deep Dive

```mermaid
graph TB
    RDF["react-dev-framework/"]
    
    subgraph SRC["src/"]
        DF["data-factory/"]
        LOG["logging/"]
        DT["dev-toolkit/"]
        SH["shared/"]
        
        subgraph DFD["data-factory structure"]
            DFC["core/"]
            DFFG["generators/"]
            DFP["persistence/"]
            DFSE["seeds/"]
            DFH["hooks/"]
        end
        
        subgraph LOGD["logging structure"]
            LOGCO["core/"]
            LOGDO["domains/"]
            LOGF["formatters/"]
            LOGUI["ui/"]
        end
        
        subgraph DTD["dev-toolkit structure"]
            DTCO["core/"]
            DTSIM["simulators/"]
            DTH["hooks/"]
            DTUI["ui/"]
        end
        
        subgraph SHD["shared structure"]
            SHH["hooks/"]
            SHU["utils/"]
            SHC["constants/"]
            SHT["types/"]
        end
        
        DF --> DFD
        LOG --> LOGD
        DT --> DTD
        SH --> SHD
    end
    
    subgraph EX["examples/"]
        FD["food-delivery/"]
        EC["ecommerce/"]
        SA["saas/"]
    end
    
    subgraph DOC["docs/"]
        API["API.md"]
        QS["QUICKSTART.md"]
        DF2["DATA_FACTORY.md"]
        ADV["ADVANCED.md"]
    end
    
    RDF --> SRC
    RDF --> EX
    RDF --> DOC
```

## Usage Flow: From Schema to App

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant SCHEMA as Schema Registry
    participant FACTORY as DataFactory
    participant REDUX as ReduxStore
    participant LOGGER as Logger
    participant COMP as Component
    
    DEV->>SCHEMA: Define user.schema.ts
    DEV->>FACTORY: factory.schema('user', def)
    DEV->>FACTORY: factory.create('user', {count: 50})
    FACTORY-->>REDUX: Preload state
    REDUX-->>COMP: Provide initial state
    
    COMP->>LOGGER: logger.component.mount('UserList')
    COMP->>REDUX: dispatch(fetchUsers())
    REDUX->>LOGGER: logger.redux.action('fetchUsers', payload)
    REDUX-->>COMP: Update state
    COMP->>LOGGER: logger.component.render('UserList', props)
    
    COMP->>DEV: Render UI
    
    DEV->>LOGGER: window.__DEV__.logger.getLogs()
    LOGGER-->>DEV: Return filtered logs
```

## Error Handling Flow

```mermaid
graph TD
    subgraph DETECT["Error Detection"]
        TRY["Try-Catch"]
        API["API Failure"]
        REDUX["Redux Error"]
        COMP["Component Error"]
    end

    subgraph LOG["Logging"]
        LE["Create LogEntry<br/>level: ERROR"]
        ST["Add StackTrace"]
        TAG["Add Tags<br/>(#error, #api, etc)"]
    end

    subgraph HANDLE["Handling"]
        UI["Show Error UI"]
        RETRY["Provide Retry"]
        TRACK["Send to Sentry"]
    end

    subgraph QUERY["Debugging"]
        FILTER["Filter all errors<br/>getLogs({level: ERROR})"]
        EXPORT["Export for analysis<br/>export('json')"]
        STATS["View statistics"]
    end

    TRY --> LE
    API --> LE
    REDUX --> LE
    COMP --> LE
    LE --> ST
    ST --> TAG
    TAG --> UI
    TAG --> RETRY
    TAG --> TRACK
    UI --> FILTER
    RETRY --> FILTER
    FILTER --> EXPORT
    EXPORT --> STATS

    style DETECT fill:#ffcdd2
    style LOG fill:#fff9c4
    style HANDLE fill:#c8e6c9
    style QUERY fill:#bbdefb
```

## Performance Monitoring Architecture

```mermaid
graph TD
    subgraph SPAN["Performance Spans"]
        START["span.start<br/>Mark: t0"]
        WORK["Execute<br/>Async Work"]
        END["span.end<br/>Mark: t1"]
    end

    subgraph CALC["Calculate"]
        DUR["duration = t1 - t0"]
        LOG["logger.perf.span<br/>Create Entry"]
    end

    subgraph ANALYZE["Analysis"]
        HIST["Build Histogram<br/>of durations"]
        STATS["Calculate<br/>p50, p95, p99"]
        IDENTIFY["Identify slow<br/>operations"]
    end

    subgraph EXPORT["Export"]
        JSON_EXP["Export as JSON"]
        COMPARE["Compare with<br/>baseline"]
    end

    START --> WORK
    WORK --> END
    END --> DUR
    DUR --> LOG
    LOG --> HIST
    HIST --> STATS
    STATS --> IDENTIFY
    IDENTIFY --> JSON_EXP
    JSON_EXP --> COMPARE

    style SPAN fill:#e1f5fe
    style CALC fill:#fff3e0
    style ANALYZE fill:#f3e5f5
    style EXPORT fill:#e8f5e9
```

