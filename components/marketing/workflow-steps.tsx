import React from "react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export function WorkflowSteps() {
  const steps = [
    {
      stepNumber: "01",
      code: "[INIT]",
      title: "Drop or Select Files",
      description: "Drop your files into the browser. MIME types and document headers are parsed locally without immediate transmission.",
      state: "Local Ingestion",
    },
    {
      stepNumber: "02",
      code: "[EXECUTE]",
      title: "In-Memory Processing",
      description: "Transformations execute inside client WebAssembly sandboxes or isolated, stateless ephemeral workers.",
      state: "Sandboxed RAM",
    },
    {
      stepNumber: "03",
      code: "[PURGE]",
      title: "Export & Cache Teardown",
      description: "Save high-fidelity files directly to your device. All temporary memory allocations are purged immediately.",
      state: "Buffer Cleared",
    },
  ];

  return (
    <section className="py-16 md:py-24 border-t border-border-subtle bg-background">
      <Container size="xl">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
          <Badge variant="accent" size="md" dot className="mb-4">
            Execution Lifecycle
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-3">
            Three steps to secure document productivity.
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            From file ingestion to immediate memory teardown, every step is engineered for zero data residue.
          </p>
        </div>

        {/* Connected Linear Pipeline */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Desktop Connecting Line behind nodes */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-border-strong -z-0" />

          {steps.map((item, index) => (
            <div
              key={item.stepNumber}
              className="relative z-10 flex flex-col p-6 rounded-xl bg-surface-base border border-border-default hover:border-border-accent/70 transition-all duration-200 shadow-card"
            >
              {/* Step Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-lg bg-surface-raised border border-border-default flex items-center justify-center text-accent font-mono font-bold text-sm">
                    {item.stepNumber}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    {item.code}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded border border-border-accent-subtle">
                  {item.state}
                </span>
              </div>

              {/* Step Title & Description */}
              <h3 className="text-base font-bold text-text-primary mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed flex-1">
                {item.description}
              </p>

              {/* Bottom Step Indicator */}
              <div className="mt-4 pt-3 border-t border-border-subtle/80 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>Phase {index + 1} of 3</span>
                <span className="text-accent">● Complete</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
