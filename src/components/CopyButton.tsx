import { useState } from 'react';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button, ButtonProps } from './Button';
import { Icon, IconName } from './Icon';
import { IconButton } from './IconButton';

export type CopyButtonProps = {
  value?: string;
  buttonType?: 'text' | 'icon' | 'default';
  children?: React.ReactNode;
} & ButtonProps;

export const CopyButton = ({
  value,
  buttonType = 'default',
  children,
  ...buttonProps
}: CopyButtonProps) => {
  const stringGetter = useStringGetter();
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    if (!value) return;

    setCopied(true);
    navigator.clipboard.writeText(value);
    setTimeout(() => setCopied(false), 500);
  };

  return buttonType === 'text' ? (
    <Styled.InlineRow onClick={onCopy} copied={copied}>
      {children}
      <Styled.Icon copied={copied} iconName={copied ? IconName.Check : IconName.Copy} />
    </Styled.InlineRow>
  ) : buttonType === 'icon' ? (
    <Styled.IconButton
      {...buttonProps}
      copied={copied}
      action={ButtonAction.Base}
      iconName={copied ? IconName.Check : IconName.Copy}
      onClick={onCopy}
    />
  ) : (
    <Button
      {...buttonProps}
      action={copied ? ButtonAction.Create : ButtonAction.Primary}
      onClick={onCopy}
    >
      <Icon iconName={IconName.Copy} />
      {children ?? stringGetter({ key: copied ? STRING_KEYS.COPIED : STRING_KEYS.COPY })}
    </Button>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.InlineRow = styled.div<{ copied: boolean }>`
  ${layoutMixins.inlineRow}
  cursor: pointer;

  ${({ copied }) =>
    copied
      ? css`
          filter: brightness(0.8);
        `
      : css`
          &:hover {
            filter: brightness(1.1);
            text-decoration: underline;
          }
        `}
`;

Styled.Icon = styled(Icon)<{ copied: boolean }>`
  ${({ copied }) =>
    copied &&
    css`
      color: var(--color-positive);
    `}
`;

Styled.IconButton = styled(IconButton)<{ copied: boolean }>`
  ${({ copied }) =>
    copied &&
    css`
      svg {
        color: var(--color-positive);
      }
    `}
`;
