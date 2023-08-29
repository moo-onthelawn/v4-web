import { type Dispatch, type SetStateAction, useState } from 'react';
import styled, { type AnyStyledComponent, css } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';
import type { RouteData, TokenData } from '@0xsquid/sdk';
import BigNumber from 'bignumber.js';

import {
  ButtonAction,
  ButtonShape,
  ButtonSize,
  ButtonState,
  ButtonType,
} from '@/constants/buttons';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useStringGetter } from '@/hooks';
import { useMatchingEvmNetwork } from '@/hooks/useMatchingEvmNetwork';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Details, DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithReceipt } from '@/components/WithReceipt';

import { getSubaccountBuyingPower, getSubaccountEquity } from '@/state/accountSelectors';

import { BIG_NUMBERS, MustBigNumber } from '@/lib/numbers';
import squidRouter from '@/lib/squidRouter';

import { SlippageEditor } from './SlippageEditor';

type ElementProps = {
  isDisabled?: boolean;
  isLoading?: boolean;

  chainId?: string | number;
  setError?: Dispatch<SetStateAction<Error | undefined>>;
  slippage: number;
  setSlippage: (slippage: number) => void;
  sourceToken?: TokenData;
  squidRoute?: RouteData;
};

export const DepositButtonAndReceipt = ({
  chainId,
  setError,
  slippage,
  setSlippage,
  sourceToken,
  squidRoute,

  isDisabled,
  isLoading,
}: ElementProps) => {
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [isEditingSlippage, setIsEditingSlipapge] = useState(false);
  const stringGetter = useStringGetter();

  const {
    matchNetwork: switchNetwork,
    isSwitchingNetwork,
    isMatchingNetwork,
  } = useMatchingEvmNetwork({
    chainId,
    onError: setError,
  });

  const { current: equity, postOrder: newEquity } =
    useSelector(getSubaccountEquity, shallowEqual) || {};

  const { current: buyingPower, postOrder: newBuyingPower } =
    useSelector(getSubaccountBuyingPower, shallowEqual) || {};

  const { gasCosts, feeCosts } = squidRoute?.estimate || {};

  const totalGasCosts =
    gasCosts?.reduce(
      (acc: BigNumber, { amountUSD }: { amountUSD: string }) => acc.plus(MustBigNumber(amountUSD)),
      BIG_NUMBERS.ZERO
    ) || BIG_NUMBERS.ZERO;

  const totalFeeCosts =
    feeCosts?.reduce(
      (acc: BigNumber, { amountUSD }: { amountUSD: string }) => acc.plus(MustBigNumber(amountUSD)),
      BIG_NUMBERS.ZERO
    ) || BIG_NUMBERS.ZERO;

  const totalFees = totalGasCosts.plus(totalFeeCosts);

  const feeSubitems: DetailsItem[] = feeCosts
    ? feeCosts.map(({ amountUSD, name }: { amountUSD: string; name: string }) => ({
        key: name,
        label: <span>{name}</span>,
        value: <Output type={OutputType.Fiat} value={amountUSD} />,
      }))
    : [];

  if (gasCosts) {
    feeSubitems.push({
      key: 'gas-fees',
      label: <span>{stringGetter({ key: STRING_KEYS.GAS_FEE })}</span>,
      value: <Output type={OutputType.Fiat} value={totalGasCosts} />,
    });
  }

  const hasSubitems = feeSubitems.length > 0;

  const showSubitemsToggle = showFeeBreakdown
    ? stringGetter({ key: STRING_KEYS.HIDE_ALL_DETAILS })
    : stringGetter({ key: STRING_KEYS.SHOW_ALL_DETAILS });

  const submitButtonReceipt = [
    {
      key: 'equity',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.EQUITY })} <Tag>USDC</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Fiat}
          value={equity}
          newValue={newEquity}
          sign={NumberSign.Positive}
          withDiff={Boolean(newEquity) && equity !== newEquity}
        />
      ),
    },
    {
      key: 'buying-power',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.BUYING_POWER })} <Tag>USDC</Tag>
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Fiat}
          value={buyingPower}
          newValue={newBuyingPower}
          sign={NumberSign.Positive}
          withDiff={Boolean(newBuyingPower) && buyingPower !== newBuyingPower}
        />
      ),
    },
    {
      key: 'exchange-rate',
      label: <span>{stringGetter({ key: STRING_KEYS.EXCHANGE_RATE })}</span>,
      value: sourceToken && squidRoute && (
        <Styled.ExchangeRate>
          <Output
            type={OutputType.Asset}
            value={1}
            fractionDigits={0}
            tag={<Tag>{sourceToken?.symbol}</Tag>}
          />
          =
          <Output
            type={OutputType.Asset}
            value={squidRoute?.estimate?.exchangeRate}
            tag={<Tag>{squidRouter.SQUID_ROUTE_DEFAULTS.toToken.toUpperCase()}</Tag>}
          />
        </Styled.ExchangeRate>
      ),
    },
    {
      key: 'total-fees',
      label: <span>{stringGetter({ key: STRING_KEYS.TOTAL_FEES })}</span>,
      value: squidRoute && <Output type={OutputType.Fiat} value={totalFees} />,
      subitems: feeSubitems,
    },
    {
      key: 'slippage',
      label: <span>{stringGetter({ key: STRING_KEYS.SLIPPAGE })}</span>,
      value: (
        <SlippageEditor
          slippage={slippage}
          setIsEditing={setIsEditingSlipapge}
          setSlippage={setSlippage}
        />
      ),
    },
  ];

  const isFormValid = !isDisabled && !isEditingSlippage;

  return (
    <Styled.WithReceipt
      slotReceipt={
        <Styled.CollapsibleDetails>
          <Styled.Details showSubitems={showFeeBreakdown} items={submitButtonReceipt} />
          <Styled.DetailButtons>
            {hasSubitems && (
              <Styled.ToggleButton
                shape={ButtonShape.Pill}
                size={ButtonSize.XSmall}
                isPressed={showFeeBreakdown}
                onPressedChange={setShowFeeBreakdown}
                slotLeft={<Icon iconName={IconName.Caret} />}
              >
                {showSubitemsToggle}
              </Styled.ToggleButton>
            )}
          </Styled.DetailButtons>
        </Styled.CollapsibleDetails>
      }
    >
      {!isMatchingNetwork ? (
        <Button
          action={ButtonAction.Primary}
          onClick={switchNetwork}
          state={{ isLoading: isSwitchingNetwork || isLoading }}
        >
          {stringGetter({ key: STRING_KEYS.SWITCH_NETWORK })}
        </Button>
      ) : (
        <Button type={ButtonType.Submit} state={{ isDisabled: !isFormValid, isLoading }}>
          {stringGetter({ key: STRING_KEYS.DEPOSIT_FUNDS })}
        </Button>
      )}
    </Styled.WithReceipt>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ExchangeRate = styled.span`
  ${layoutMixins.row}
  gap: 1ch;
`;

Styled.WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

Styled.CollapsibleDetails = styled.div`
  ${layoutMixins.column}
  padding: 0.375rem 1rem 0.5rem;
  gap: 0.5rem;
`;

Styled.Details = styled(Details)`
  font-size: 0.8125em;
`;

Styled.DetailButtons = styled.div`
  ${layoutMixins.spacedRow}
`;

Styled.ToggleButton = styled(ToggleButton)`
  --button-toggle-off-backgroundColor: transparent;
  --button-toggle-on-backgroundColor: transparent;
  --button-toggle-on-textColor: var(--color-text-0);

  svg {
    width: 0.875em;
    height: 0.875em;
  }

  &[data-state='on'] {
    svg {
      transform: rotate(180deg);
    }
  }
`;