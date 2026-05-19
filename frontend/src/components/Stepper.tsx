import { Fragment } from "react";

import { Icon } from "@/components/ui/Icon";

const STEPS = [
  { label: "Input", num: 1 },
  { label: "Outline", num: 2 },
  { label: "Content", num: 3 },
];

// current: 0 = input, 1 = outline, 2 = content
export function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <div className="stepper">
      {STEPS.map((step, index) => {
        const state =
          index < current ? "is-done" : index === current ? "is-current" : "";
        return (
          <Fragment key={step.label}>
            <div className={`stepper__step ${state}`}>
              <div className="stepper__num">
                {index < current ? (
                  <Icon name="check" size={11} stroke={3} />
                ) : (
                  step.num
                )}
              </div>
              <span className="stepper__label">{step.label}</span>
            </div>
            {index < STEPS.length - 1 ? (
              <div className="stepper__sep">
                <Icon name="chevron-right" size={14} stroke={2} />
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
